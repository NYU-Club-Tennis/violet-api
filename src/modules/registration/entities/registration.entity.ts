import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from '../../session/entities/session.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  IRegistration,
  RegistrationStatus,
} from '../interfaces/registration.interface';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity()
export class Registration extends BaseEntity implements IRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  sessionId: number;

  @Column({ default: 0 })
  position: number; // 0 = regular registration, 1+ = waitlist position

  @Column({ type: 'timestamp', nullable: true })
  lastCancellation: Date | null;

  @Column({ default: false })
  hasAttended: boolean;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.REGISTERED,
  })
  status: RegistrationStatus;

  @ManyToOne(() => Session, (session) => session.registrations)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ManyToOne(() => User, (user) => user.registrations)
  @JoinColumn({ name: 'userId' })
  user: User;
}
