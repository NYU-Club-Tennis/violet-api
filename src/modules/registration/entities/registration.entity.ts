import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from '../../session/entities/session.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { IRegistration } from '../interfaces/registration.interface';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity()
export class Registration extends BaseEntity implements IRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  sessionId: number;

  @ManyToOne(() => Session, (session) => session.id)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;
}
