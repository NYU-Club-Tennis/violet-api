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

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
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
    const updatedSession = this.sessionRepository.merge(session, params);
    return this.sessionRepository.save(updatedSession);
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
        deletedAt: IsNull(),
      },
    });
    return { count };
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
}
