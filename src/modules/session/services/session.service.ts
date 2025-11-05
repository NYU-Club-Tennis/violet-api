import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  FindManyOptions,
  ILike,
  MoreThan,
  In,
  ArrayContains,
  IsNull,
} from 'typeorm';
import { Session } from '../entities/session.entity';
import { Registration } from '../../registration/entities/registration.entity';
import {
  ISession,
  ISessionCreate,
  ISessionPaginateQuery,
  ISessionCountResponse,
} from '../interfaces/session.interface';
import { SessionStatus } from 'src/constants/enum/session.enum';
import { MailService } from '../../mail/services/mail.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    private mailService: MailService,
  ) {}
  async findAll(): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async findById(id: number, relations: string[] = []) {
    return this.sessionRepository.findOneOrFail({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations,
    });
  }

  async deleteOne(id: number): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Send cancellation notification before deleting
    await this.sendSessionCancellationNotification(id);

    // First, soft delete all associated registrations (only non-deleted ones)
    const registrations = await this.registrationRepository.find({
      where: { sessionId: id, deletedAt: IsNull() },
    });

    if (registrations.length > 0) {
      // Soft delete all active registrations for this session
      const registrationIds = registrations.map((reg) => reg.id);
      await this.registrationRepository.softDelete(registrationIds);

      console.log(
        `Soft deleted ${registrations.length} registrations for session ${id}`,
      );
    }

    // Then soft delete the session itself
    await this.sessionRepository.softDelete(id);

    console.log(`Soft deleted session ${id}`);

    return session;
  }

  async create(sessionData: ISessionCreate) {
    const session = await this.sessionRepository.save({
      ...sessionData,
      status: sessionData.status || SessionStatus.OPEN,
    });
    return session;
  }

  async update(id: number, params: Partial<ISession>): Promise<Session> {
    const session = await this.findById(id);
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Handle automatic spots management for status changes
    if (params.status) {
      if (params.status === 'FULL' || params.status === 'CLOSED') {
        // Set spots available to 0 for FULL and CLOSED statuses
        params.spotsAvailable = 0;
      }
      // For OPEN and VIEW_ONLY, keep current spots available
    }

    // If spots are being reduced, check if it affects existing registrations
    if (
      params.spotsTotal !== undefined &&
      params.spotsTotal < session.spotsTotal
    ) {
      const spotsReduction = session.spotsTotal - params.spotsTotal;
      const currentRegistrations = await this.registrationRepository.count({
        where: { sessionId: id, deletedAt: IsNull() },
      });

      if (currentRegistrations > params.spotsTotal) {
        throw new InternalServerErrorException(
          `Cannot reduce spots to ${params.spotsTotal} as there are already ${currentRegistrations} registrations`,
        );
      }

      // Update available spots accordingly
      params.spotsAvailable = Math.max(
        0,
        session.spotsAvailable - spotsReduction,
      );
    }

    Object.assign(session, params);
    const updatedSession = await this.sessionRepository.save(session);

    // Reload full session to ensure all fields (like name) are present
    const fullSession = await this.findById(updatedSession.id);

    // Send notification if session details changed significantly
    await this.sendSessionUpdateNotification(fullSession, params);

    return updatedSession;
  }

  async archive(id: number): Promise<Session> {
    const session = await this.findById(id);
    session.isArchived = true;
    session.status = SessionStatus.CLOSED;
    session.spotsAvailable = 0;
    return this.sessionRepository.save(session);
  }

  async unarchive(id: number): Promise<Session> {
    const session = await this.findById(id);
    session.isArchived = false;
    return this.sessionRepository.save(session);
  }

  /**
   * Send notification when session details are updated
   */
  private async sendSessionUpdateNotification(
    session: Session,
    changes: Partial<ISession>,
  ): Promise<void> {
    // Do not notify if the session is archived
    if (session.isArchived) {
      return;
    }
    try {
      // Get registered users for this session
      const registrations = await this.registrationRepository.find({
        where: { sessionId: session.id, deletedAt: IsNull() },
        relations: ['user'],
      });

      if (registrations.length === 0) return;

      const userEmails = registrations
        .map((reg) => reg.user?.email)
        .filter(Boolean) as string[];

      // Determine what changed and create appropriate message
      let notificationBody = '';
      let subject = '';

      // Check for status changes first
      if (changes.status) {
        subject = 'Session Updated';
        notificationBody = `The session "${session.name}" has been updated:\n\n`;

        // Add status change information
        const statusDescriptions = {
          OPEN: 'Open for registrations',
          FULL: 'Full but waitlist available',
          VIEW_ONLY: 'View only - no new registrations',
          CLOSED: 'Closed - no registrations or waitlist',
        };

        notificationBody += `Status: ${statusDescriptions[changes.status] || changes.status}\n`;
      }

      // Add other change information
      if (changes.date || changes.time) {
        if (!subject) {
          subject = 'Session Time/Date Updated';
          notificationBody = `The session "${session.name}" has been updated:\n\n`;
        }
        if (changes.date) {
          notificationBody += `New Date: ${new Date(changes.date).toLocaleDateString()}\n`;
        }
        if (changes.time) {
          notificationBody += `New Time: ${changes.time}\n`;
        }
      }

      if (changes.location) {
        if (!subject) {
          subject = 'Session Location Updated';
          notificationBody = `The session "${session.name}" has been updated:\n\n`;
        }
        notificationBody += `New Location: ${changes.location}\n`;
      }

      if (changes.spotsTotal) {
        if (!subject) {
          subject = 'Session Capacity Updated';
          notificationBody = `The session "${session.name}" has been updated:\n\n`;
        }
        notificationBody += `New Capacity: ${changes.spotsTotal} spots\n`;
      }

      // Add closing message
      if (notificationBody) {
        notificationBody += `\nPlease check the updated session details.`;
      }

      if (notificationBody && userEmails.length > 0) {
        await this.mailService.sendSessionNotification(
          userEmails,
          subject,
          notificationBody,
        );
      }
    } catch (error) {
      // Log error but don't fail the session update
      console.error('Failed to send session update notification:', error);
    }
  }

  /**
   * Send notification when session is cancelled
   */
  async sendSessionCancellationNotification(sessionId: number): Promise<void> {
    try {
      const session = await this.findById(sessionId);
      const registrations = await this.registrationRepository.find({
        where: { sessionId, deletedAt: IsNull() },
        relations: ['user'],
      });

      if (registrations.length === 0) return;

      const userEmails = registrations
        .map((reg) => reg.user?.email)
        .filter(Boolean) as string[];

      const subject = 'Session Cancelled';
      const body = `The session "${session.name}" scheduled for ${new Date(session.date).toLocaleDateString()} at ${session.time} has been cancelled.\n\nWe apologize for any inconvenience.`;

      if (userEmails.length > 0) {
        await this.mailService.sendSessionNotification(
          userEmails,
          subject,
          body,
        );
      }
    } catch (error) {
      console.error('Failed to send session cancellation notification:', error);
    }
  }

  async findPaginate(query: ISessionPaginateQuery) {
    const {
      page,
      limit,
      search,
      location,
      skillLevels,
      date,
      hasSpots,
      sortOptions,
      archived,
    } = query;

    const findOptions: FindManyOptions<Session> = {
      take: limit,
      skip: (page - 1) * limit,
      order: {},
      where: { deletedAt: IsNull() }, // Exclude soft-deleted sessions
    };

    if (search) {
      const searchTerm = search.trim();
      findOptions.where = [
        { name: ILike(`%${searchTerm}%`), deletedAt: IsNull() },
        { location: ILike(`%${searchTerm}%`), deletedAt: IsNull() },
      ];
    }

    const whereConditions: any = { deletedAt: IsNull() };

    if (typeof archived === 'boolean') {
      whereConditions.isArchived = archived;
    }

    if (location) {
      whereConditions.location = location;
    }

    if (skillLevels && skillLevels.length > 0) {
      // Find sessions that have ANY of the requested skill levels
      whereConditions.skillLevels = ArrayContains(skillLevels);
    }

    if (date) {
      whereConditions.date = date;
    }

    if (hasSpots) {
      whereConditions.spotsAvailable = MoreThan(0);
    }

    if (Object.keys(whereConditions).length > 1) {
      // More than just deletedAt
      if (Array.isArray(findOptions.where)) {
        // If we have search conditions, merge with filters
        findOptions.where = findOptions.where.map((condition) => ({
          ...condition,
          ...whereConditions,
        }));
      } else {
        // If no search, just use filter conditions
        findOptions.where = whereConditions;
      }
    }

    // Handle sorting
    if (sortOptions?.length) {
      sortOptions.forEach((option) => {
        findOptions.order = {
          ...findOptions.order,
          ...option,
        };
      });
    } else {
      // Default sorting by date and time if no sort options provided
      findOptions.order = {
        date: 'ASC',
        time: 'ASC',
      };
    }

    try {
      // Return both the paginated results and total count
      return this.sessionRepository.findAndCount(findOptions);
    } catch (error) {
      console.error('Error in findPaginate:', error);
      throw new InternalServerErrorException('Error fetching sessions');
    }
  }

  async getActiveSessionsCount(): Promise<ISessionCountResponse> {
    const count = await this.sessionRepository.count({
      where: {
        status: SessionStatus.OPEN,
        isArchived: false,
        deletedAt: IsNull(),
      },
    });
    return { count };
  }

  async getUserSessions(
    userId: number,
    type: 'upcoming' | 'past',
  ): Promise<Session[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .innerJoin('session.registrations', 'registration')
      .where('registration.userId = :userId', { userId })
      .andWhere('registration.deletedAt IS NULL')
      .andWhere('session.deletedAt IS NULL');

    if (type === 'upcoming') {
      // Sessions that are today or in the future
      queryBuilder.andWhere(
        '(session.date > :today OR (session.date = :today AND session.time > :currentTime))',
        {
          today,
          currentTime: now.toTimeString().slice(0, 5), // HH:MM format
        },
      );
    } else if (type === 'past') {
      // Sessions that are in the past
      queryBuilder.andWhere(
        '(session.date < :today OR (session.date = :today AND session.time <= :currentTime))',
        {
          today,
          currentTime: now.toTimeString().slice(0, 5), // HH:MM format
        },
      );
    }

    queryBuilder
      .orderBy('session.date', 'ASC')
      .addOrderBy('session.time', 'ASC');

    return queryBuilder.getMany();
  }

  async cancelSessionRegistration(
    sessionId: number,
    userId: number,
  ): Promise<{ success: boolean }> {
    // Find the registration for this user and session
    const registration = await this.registrationRepository.findOne({
      where: {
        sessionId,
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found for this session');
    }

    // Soft delete the registration
    await this.registrationRepository.softDelete(registration.id);

    // Update the session's available spots
    const session = await this.findOne(sessionId);
    session.spotsAvailable += 1;
    await this.sessionRepository.save(session);

    return { success: true };
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }

  // Helper method to format time if needed
  private formatTime(time: string): string {
    // Add any time formatting logic you need
    return time;
  }

  /**
   * Automatically archive past sessions by setting isArchived to true
   * This method is designed to be called by a cron job
   */
  async autoArchivePastSessions(): Promise<{
    archivedCount: number;
    message: string;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

      const result = await this.sessionRepository
        .createQueryBuilder()
        .update(Session)
        .set({
          isArchived: true,
          status: SessionStatus.CLOSED,
          spotsAvailable: 0,
        })
        .where('deletedAt IS NULL')
        .andWhere('isArchived = :archived', { archived: false })
        .andWhere('date < :today', { today })
        .execute();

      const archivedCount = result.affected || 0;

      console.log(
        `Automatically archived ${archivedCount} past sessions on ${today}`,
      );

      return {
        archivedCount,
        message: `Successfully archived ${archivedCount} past sessions`,
      };
    } catch (error) {
      console.error('Error auto-archiving past sessions:', error);
      throw new InternalServerErrorException('Failed to archive past sessions');
    }
  }
}
