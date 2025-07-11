import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ISession } from '../interfaces/session.interface';
import { Registration } from 'src/modules/registration/entities/registration.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { SessionStatus } from 'src/constants/enum/session.enum';

@Entity()
export class Session extends BaseEntity implements ISession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  location: string;

  @Column()
  name: string;

  @Column()
  time: string;

  @Column()
  date: string;

  @Column()
  skillLevel: string;

  @Column()
  spotsAvailable: number;

  @Column()
  spotsTotal: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.OPEN,
  })
  status: SessionStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @OneToMany(() => Registration, (registration) => registration.id)
  @JoinColumn({
    name: 'registrationId',
  })
  registration: Registration;
}
