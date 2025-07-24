import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { User } from '../entities/user.entity';
import { env } from 'src/constants/environment.constant';
import {
  IUserCreate,
  IUserPaginateQuery,
  IUserCountResponse,
} from '../interfaces/user.interface';

import * as bcrypt from 'bcryptjs';
import { REDIS_CLIENT } from 'src/constants/redis.constant';
import Redis from 'ioredis';
import { AuthService } from 'src/modules/auth/services/auth.service';
@Injectable()
export class UserService {
  private readonly salt: number = env.salt;
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(params: IUserCreate) {
    // Hash the password before saving
    if (params.password) {
      params.password = await bcrypt.hash(params.password, this.salt);
    }

    const user = await this.usersRepository.save(params);

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findById(id: number, relations: string[] = []) {
    return this.usersRepository.findOne({
      where: {
        id,
      },
      relations,
    });
  }

  async isEmailExisted(email: string) {
    const count = await this.usersRepository.count({
      where: {
        email,
      },
    });

    return count > 0;
  }

  async update(id: number, params: Partial<User>) {
    const user = await this.findById(id);
    if (params.password) {
      params.password = await bcrypt.hashSync(params.password, this.salt);
    }

    if (!user) {
      throw new Error('User not found');
    }

    this.usersRepository.merge(user, params);

    const updateUser = await this.usersRepository.save(user);
    const { password: _, ...restUser } = updateUser;
    return restUser;
  }

  async updateLastSignInAt(id: number) {
    return this.usersRepository.update(
      { id },
      { lastSignInAt: new Date().toISOString() },
    );
  }

  async incrementNoShowCount(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.noShowCount += 1;
    return this.usersRepository.save(user);
  }

  async resetNoShowCount(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.noShowCount = 0;
    return this.usersRepository.save(user);
  }

  async delete(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.usersRepository.softRemove(user);
  }

  async bulkDelete(userData: User[]) {
    return this.usersRepository.softRemove(userData, { chunk: 20 });
  }

  async findPaginate(query: IUserPaginateQuery) {
    const { page, limit, search, sortOptions } = query;

    const findOptions: FindManyOptions<User> = {
      take: limit,
      skip: (page - 1) * limit,
      order: {},
      where: {},
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isAdmin: true,
        noShowCount: true,
        lastSignInAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from results
      },
    };

    // Handle search functionality
    if (search) {
      const searchTerm = search.trim();
      findOptions.where = [
        { firstName: ILike(`%${searchTerm}%`) },
        { lastName: ILike(`%${searchTerm}%`) },
        { email: ILike(`%${searchTerm}%`) },
      ];
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
      // Default sorting by creation date (newest first)
      findOptions.order = {
        createdAt: 'DESC',
      };
    }

    try {
      // Return both the paginated results and total count
      return this.usersRepository.findAndCount(findOptions);
    } catch (error) {
      console.error('Error in findPaginate:', error);
      throw new Error('Error fetching users');
    }
  }

  async getTotalUsersCount(): Promise<IUserCountResponse> {
    const count = await this.usersRepository.count();
    return { count };
  }
}
