import { IBaseEntity } from 'src/common/interfaces/common.interface';

export interface IRegistration extends IBaseEntity {
  id: number;
  userId: number;
  sessionId: number;
}
