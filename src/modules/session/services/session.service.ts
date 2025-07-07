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
} from 'typeorm';
import { Session } from '../entities/session.entity';
import {
  ISession,
  ISessionCreate,
  ISessionPaginateQuery,
} from '../interfaces/session.interface';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}
  async findAll(): Promise<Session[]> {
    return this.sessionRepository.find();
  }

  async findOne(id: number): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async findById(id: number, relations: string[] = []) {
    return this.sessionRepository.findOneOrFail({
      where: {
        id,
      },
      relations,
    });
  }

  async deleteOne(id: number): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    await this.sessionRepository.delete(id);
    return session;
  }

  async create(sessionData: ISessionCreate) {
    const session = await this.sessionRepository.save(sessionData);
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
      skillLevel,
      date,
      hasSpots,
      sortOptions,
    } = query;

    const findOptions: FindManyOptions<Session> = {
      take: limit,
      skip: (page - 1) * limit,
      order: {},
      where: {},
    };

    if (search) {
      const searchTerm = search.trim();
      findOptions.where = [
        { name: ILike(`%${searchTerm}%`) },
        { location: ILike(`%${searchTerm}%`) },
      ];
    }

    const whereConditions: any = {};

    if (location) {
      whereConditions.location = location;
    }

    if (skillLevel) {
      whereConditions.skillLevel = skillLevel;
    }

    if (date) {
      whereConditions.date = date;
    }

    if (hasSpots) {
      whereConditions.spotsAvailable = MoreThan(0);
    }
    if (Object.keys(whereConditions).length > 0) {
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
      throw new InternalServerErrorException('Error fetching sessions');
    }
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
