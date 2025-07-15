import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Registration } from '../entities/registration.entity';
import { Repository, LessThan, In, MoreThanOrEqual } from 'typeorm';
import { RegistrationStatus } from '../interfaces/registration.interface';
import { UserService } from '../../user/services/user.service';
import {
  RegistrationResponseDto,
  GetRegistrationHistoryQueryDto,
} from '../dto/registration.dto';
import { Session } from '../../session/entities/session.entity';
import { SessionStatus } from 'src/constants/enum/session.enum';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private userService: UserService,
  ) {}

  private toResponseDto(registration: Registration): RegistrationResponseDto {
    const response = new RegistrationResponseDto();
    Object.assign(response, {
      ...registration,
      createdAt: registration.createdAt
        ? new Date(registration.createdAt)
        : new Date(),
      updatedAt: registration.updatedAt
        ? new Date(registration.updatedAt)
        : new Date(),
      deletedAt: registration.deletedAt
        ? new Date(registration.deletedAt)
        : null,
      lastCancellation: registration.lastCancellation
        ? new Date(registration.lastCancellation)
        : null,
    });
    return response;
  }

  async create(
    userId: number,
    sessionId: number,
  ): Promise<RegistrationResponseDto> {
    // Check if session exists and get its capacity info
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Check if session is closed
    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Session is closed for registration');
    }

    // Check if user has any existing registration for this session
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        userId,
        sessionId,
        status: RegistrationStatus.REGISTERED,
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('User already registered for this session');
    }

    // Check if user is already on waitlist
    const existingWaitlist = await this.registrationRepository.findOne({
      where: {
        userId,
        sessionId,
        status: RegistrationStatus.WAITLISTED,
      },
    });

    if (existingWaitlist) {
      throw new BadRequestException(
        'User is already on the waitlist for this session',
      );
    }

    // Check if session has available spots
    const isAtCapacity = session.spotsAvailable <= 0;
    console.log(`Session ${sessionId} capacity check:`, {
      spotsTotal: session.spotsTotal,
      spotsAvailable: session.spotsAvailable,
      isAtCapacity,
    });

    // If session is at capacity, add to waitlist
    let position = 0;
    let status = RegistrationStatus.REGISTERED;

    if (isAtCapacity) {
      // Get highest waitlist position
      const lastWaitlistEntry = await this.registrationRepository
        .createQueryBuilder('registration')
        .where('registration.sessionId = :sessionId', { sessionId })
        .andWhere('registration.status = :status', {
          status: RegistrationStatus.WAITLISTED,
        })
        .orderBy('registration.position', 'DESC')
        .getOne();

      position = (lastWaitlistEntry?.position ?? 0) + 1;
      status = RegistrationStatus.WAITLISTED;

      console.log(`Adding to waitlist at position ${position}`);
    }

    // Create the registration
    const registration = this.registrationRepository.create({
      userId,
      sessionId,
      position,
      status,
    });

    const savedRegistration =
      await this.registrationRepository.save(registration);

    // Update session spots if direct registration
    if (status === RegistrationStatus.REGISTERED) {
      const newSpotsAvailable = session.spotsAvailable - 1;
      await this.sessionRepository.update(sessionId, {
        spotsAvailable: newSpotsAvailable,
        status: newSpotsAvailable === 0 ? SessionStatus.FULL : session.status,
      });

      console.log(`Updated session spots:`, {
        sessionId,
        oldSpots: session.spotsAvailable,
        newSpots: newSpotsAvailable,
        status: newSpotsAvailable === 0 ? SessionStatus.FULL : session.status,
      });
    }

    return this.toResponseDto(savedRegistration);
  }

  async cancel(id: number): Promise<RegistrationResponseDto> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!registration) {
      throw new BadRequestException('Registration not found');
    }

    const session = await this.sessionRepository.findOne({
      where: { id: registration.sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // If this was an active registration, handle spot management and waitlist
    if (registration.status === RegistrationStatus.REGISTERED) {
      console.log(`Cancelling active registration for session ${session.id}`);

      // Find the first person in waitlist
      const nextInWaitlist = await this.registrationRepository.findOne({
        where: {
          sessionId: registration.sessionId,
          status: RegistrationStatus.WAITLISTED,
        },
        order: {
          position: 'ASC',
        },
      });

      if (nextInWaitlist) {
        console.log(
          `Moving user ${nextInWaitlist.userId} from waitlist to registered`,
        );

        // Move them to registered status
        nextInWaitlist.position = 0;
        nextInWaitlist.status = RegistrationStatus.REGISTERED;
        await this.registrationRepository.save(nextInWaitlist);

        // Move everyone else up in the waitlist
        await this.registrationRepository
          .createQueryBuilder()
          .update(Registration)
          .set({
            position: () => 'position - 1',
          })
          .where('sessionId = :sessionId', {
            sessionId: registration.sessionId,
          })
          .andWhere('status = :status', {
            status: RegistrationStatus.WAITLISTED,
          })
          .andWhere('position > :position', {
            position: nextInWaitlist.position,
          })
          .execute();
      } else {
        // No one in waitlist, update session spots and status
        console.log(`No waitlist entries, updating session spots`);
        await this.sessionRepository.update(session.id, {
          spotsAvailable: session.spotsAvailable + 1,
          status: SessionStatus.OPEN,
        });
      }
    }

    // Set cancellation metadata
    registration.status = RegistrationStatus.CANCELLED;
    registration.lastCancellation = new Date();
    await this.registrationRepository.save(registration);

    // Perform the soft delete
    await this.registrationRepository.softDelete(id);

    console.log(`Registration ${id} cancelled successfully`);

    // Fetch the updated registration with deletedAt timestamp
    const updatedRegistration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['user'],
      withDeleted: true,
    });

    if (!updatedRegistration) {
      throw new BadRequestException(
        'Failed to fetch updated registration after deletion',
      );
    }

    return this.toResponseDto(updatedRegistration);
  }

  async markAttendance(
    id: number,
    hasAttended: boolean,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    registration.hasAttended = hasAttended;
    registration.status = hasAttended
      ? RegistrationStatus.COMPLETED
      : RegistrationStatus.NO_SHOW;

    // If marked as no-show, increment the user's no-show count
    if (!hasAttended) {
      await this.userService.incrementNoShowCount(registration.userId);
    }

    const savedRegistration =
      await this.registrationRepository.save(registration);
    return this.toResponseDto(savedRegistration);
  }

  async getRegistrationsBySession(
    sessionId: number,
  ): Promise<RegistrationResponseDto[]> {
    const registrations = await this.registrationRepository.find({
      where: {
        sessionId,
        status: RegistrationStatus.REGISTERED,
      },
      relations: ['user'],
      order: {
        position: 'ASC',
      },
    });
    return registrations.map((reg) => this.toResponseDto(reg));
  }

  async getWaitlistBySession(
    sessionId: number,
  ): Promise<RegistrationResponseDto[]> {
    const registrations = await this.registrationRepository.find({
      where: {
        sessionId,
        status: RegistrationStatus.WAITLISTED,
      },
      relations: ['user'],
      order: {
        position: 'ASC',
      },
    });
    return registrations.map((reg) => this.toResponseDto(reg));
  }

  async getUserRegistrationHistory(
    userId: number,
    query?: GetRegistrationHistoryQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    const relations: string[] = [];
    if (query?.includeSession) {
      relations.push('session');
    }
    if (query?.includeUser) {
      relations.push('user');
    }

    // Build where conditions
    const where: any = { userId };

    // Add status filter if provided
    if (query?.status?.length) {
      where.status = In(query.status);
    }

    // If afterDate is provided, join with session and filter
    if (query?.afterDate) {
      relations.push('session');
      where.session = {
        date: MoreThanOrEqual(query.afterDate),
      };
    }

    const registrations = await this.registrationRepository.find({
      where,
      relations,
      order: {
        createdAt: 'DESC',
      },
    });

    return registrations.map((reg) => this.toResponseDto(reg));
  }

  async getRecentCancellations(userId: number, days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.registrationRepository.count({
      where: {
        userId,
        status: RegistrationStatus.CANCELLED,
        lastCancellation: LessThan(date),
      },
    });
  }
}
