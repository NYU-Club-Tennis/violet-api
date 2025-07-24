import { IBaseEntity } from 'src/common/interfaces/common.interface';

export enum RegistrationStatus {
  REGISTERED = 'registered',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export interface IRegistration extends IBaseEntity {
  id: number;
  userId: number;
  sessionId: number;
  position: number;
  lastCancellation: Date | null;
  hasAttended: boolean;
  status: RegistrationStatus;
}

export interface IUserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  noShowCount: number;
}

export interface IRegistrationWithUser {
  id: number;
  userId: number;
  sessionId: number;
  position: number;
  lastCancellation: Date | null;
  hasAttended: boolean;
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: IUserInfo;
}

export interface ISessionRegistrationsResponse {
  data: IRegistrationWithUser[];
}

export interface IActiveRegistrationsCountResponse {
  count: number;
}
