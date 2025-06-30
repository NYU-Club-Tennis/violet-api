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
  registrationCount: number;
  lastCancellation: Date | null;
  hasAttended: boolean;
  status: RegistrationStatus;
}
