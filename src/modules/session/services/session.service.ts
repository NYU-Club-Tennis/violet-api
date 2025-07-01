import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Session } from '../entities/session.entity';
import { ISession, ISessionCreate } from '../interfaces/session.interface';

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
}
