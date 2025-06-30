import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { IUser } from '../interfaces/user.interface';
import { Registration } from 'src/modules/registration/entities/registration.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity()
export class User extends BaseEntity implements IUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: 0 })
  noShowCount: number;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastSignInAt?: string;

  @OneToMany(() => Registration, (registration) => registration.id)
  @JoinColumn({
    name: 'registrationId',
  })
  registration: Registration;
}
