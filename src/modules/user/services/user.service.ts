import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { env } from 'src/constants/environment.constant';
import { IUserCreate, IUserPaginateQuery } from '../interfaces/user.interface';

import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
@Injectable()
export class UserService {
  private readonly salt: number = env.salt;
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(params: IUserCreate) {
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
      { registeredAt: dayjs().toISOString() },
    );
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
}
