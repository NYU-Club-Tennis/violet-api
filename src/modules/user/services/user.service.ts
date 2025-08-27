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
import { MembershipLevel } from 'src/constants/enum/membership.enum';

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

    // If creating an admin user, ensure they have at least MEMBER level membership
    if (
      params.isAdmin &&
      (!params.membershipLevel ||
        params.membershipLevel === MembershipLevel.USER)
    ) {
      params.membershipLevel = MembershipLevel.MEMBER;
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
        membershipLevel: true,
        noShowCount: true,
        isBanned: true,
        lastSignInAt: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
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

  async updateUserRole(userId: number, isAdmin: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isAdmin = isAdmin;

    // If promoting to admin, ensure they have at least MEMBER level membership
    if (isAdmin && user.membershipLevel === MembershipLevel.USER) {
      user.membershipLevel = MembershipLevel.MEMBER;
    }

    return this.usersRepository.save(user);
  }

  async updateMembershipLevel(id: number, membershipLevel: MembershipLevel) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.membershipLevel = membershipLevel;
    return this.usersRepository.save(user);
  }

  async updateUserBanStatus(id: number, isBanned: boolean) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.isBanned = isBanned;
    return this.usersRepository.save(user);
  }

  async getUserEmailsByRoles(roles: string[]): Promise<string[]> {
    try {
      let emails: string[] = [];

      // Handle different role combinations
      const hasAdminRole = roles.includes('admin');
      const hasUserRole = roles.includes('user');
      const hasMemberRole = roles.includes('member');

      if (hasAdminRole) {
        // Get admin emails (isAdmin: true, regardless of membershipLevel)
        const adminUsers = await this.usersRepository.find({
          where: { isAdmin: true },
          select: ['email'],
        });
        emails.push(...adminUsers.map((user) => user.email));
      }

      if (hasUserRole) {
        // Get user emails (isAdmin: false AND membershipLevel: 'user')
        const userUsers = await this.usersRepository.find({
          where: {
            isAdmin: false,
            membershipLevel: MembershipLevel.USER,
          },
          select: ['email'],
        });
        emails.push(...userUsers.map((user) => user.email));
      }

      if (hasMemberRole) {
        // Get member emails (isAdmin: false AND membershipLevel: 'member')
        const memberUsers = await this.usersRepository.find({
          where: {
            isAdmin: false,
            membershipLevel: MembershipLevel.MEMBER,
          },
          select: ['email'],
        });
        emails.push(...memberUsers.map((user) => user.email));
      }

      // Remove duplicates in case a user somehow appears in multiple categories
      return [...new Set(emails)];
    } catch (error) {
      console.error('Error in getUserEmailsByRoles:', error);
      throw new Error('Error fetching user emails by roles');
    }
  }

  async getAllClubMembers(): Promise<string[]> {
    try {
      // Get ALL club members (all users in the club - users + members + admins)
      const allClubMembers = await this.usersRepository.find({
        select: ['email'],
      });

      // Remove duplicates
      return [...new Set(allClubMembers.map((user) => user.email))];
    } catch (error) {
      console.error('Error in getAllClubMembers:', error);
      throw new Error('Error fetching club member emails');
    }
  }

  async searchUsers(searchQuery: string, limit: number = 10): Promise<User[]> {
    try {
      const searchTerm = searchQuery.trim().toLowerCase();

      if (searchTerm.length < 2) {
        return [];
      }

      return await this.usersRepository
        .createQueryBuilder('user')
        .select(['user.firstName', 'user.lastName', 'user.email'])
        .where(
          "(LOWER(user.firstName) ILIKE :search OR LOWER(user.lastName) ILIKE :search OR LOWER(user.email) ILIKE :search OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) ILIKE :search)",
          { search: `%${searchTerm}%` },
        )
        .orderBy('user.firstName', 'ASC')
        .addOrderBy('user.lastName', 'ASC')
        .limit(limit)
        .getMany();
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw new Error('Error searching users');
    }
  }
}
