import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Registration } from '../entities/registration.entity';
import { Repository, LessThan } from 'typeorm';
import { RegistrationStatus } from '../interfaces/registration.interface';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    private userService: UserService,
  ) {}

  async create(userId: number, sessionId: number) {
    // Check if user has any existing registration for this session
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        userId,
        sessionId,
        status: RegistrationStatus.REGISTERED,
      },
    });

    if (existingRegistration) {
      throw new Error('User already registered for this session');
    }

    // Get user's registration count
    const registrationCount = await this.registrationRepository.count({
      where: { userId },
    });

    // Get current waitlist position if any
    const lastWaitlistPosition = await this.registrationRepository
      .createQueryBuilder('registration')
      .where('registration.sessionId = :sessionId', { sessionId })
      .andWhere('registration.position > 0')
      .orderBy('registration.position', 'DESC')
      .getOne();

    const position = lastWaitlistPosition
      ? lastWaitlistPosition.position + 1
      : 0;
    const status =
      position === 0
        ? RegistrationStatus.REGISTERED
        : RegistrationStatus.WAITLISTED;

    const registration = this.registrationRepository.create({
      userId,
      sessionId,
      position,
      registrationCount: registrationCount + 1,
      status,
    });

    return this.registrationRepository.save(registration);
  }

  async cancel(id: number) {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Update registration status and last cancellation
    registration.status = RegistrationStatus.CANCELLED;
    registration.lastCancellation = new Date();
    await this.registrationRepository.save(registration);

    // Move up everyone in the waitlist
    if (registration.position === 0) {
      const nextInWaitlist = await this.registrationRepository.findOne({
        where: {
          sessionId: registration.sessionId,
          position: 1,
          status: RegistrationStatus.WAITLISTED,
        },
      });

      if (nextInWaitlist) {
        // Move the next person from waitlist to registered
        nextInWaitlist.position = 0;
        nextInWaitlist.status = RegistrationStatus.REGISTERED;
        await this.registrationRepository.save(nextInWaitlist);

        // Move up everyone else in the waitlist
        await this.registrationRepository
          .createQueryBuilder()
          .update(Registration)
          .set({
            position: () => 'position - 1',
          })
          .where('sessionId = :sessionId', {
            sessionId: registration.sessionId,
          })
          .andWhere('position > 1')
          .andWhere('status = :status', {
            status: RegistrationStatus.WAITLISTED,
          })
          .execute();
      }
    }

    return registration;
  }

  async markAttendance(id: number, hasAttended: boolean) {
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

    return this.registrationRepository.save(registration);
  }

  async getRegistrationsBySession(sessionId: number) {
    return this.registrationRepository.find({
      where: {
        sessionId,
        status: RegistrationStatus.REGISTERED,
      },
      relations: ['user'],
      order: {
        position: 'ASC',
      },
    });
  }

  async getWaitlistBySession(sessionId: number) {
    return this.registrationRepository.find({
      where: {
        sessionId,
        status: RegistrationStatus.WAITLISTED,
      },
      relations: ['user'],
      order: {
        position: 'ASC',
      },
    });
  }

  async getUserRegistrationHistory(userId: number) {
    return this.registrationRepository.find({
      where: { userId },
      relations: ['session'],
      order: {
        createdAt: 'DESC',
      },
    });
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
