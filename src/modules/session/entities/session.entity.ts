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

  @OneToMany(() => Registration, (registration) => registration.id)
  @JoinColumn({
    name: 'registrationId',
  })
  registration: Registration;
}
