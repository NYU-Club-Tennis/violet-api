import {
  IBaseEntity,
  IPaginateQuery,
  ISortOption,
} from 'src/common/interfaces/common.interface';
import { Registration } from 'src/modules/registration/entities/registration.entity';
import { SessionStatus } from 'src/constants/enum/session.enum';
import { SkillLevel } from 'src/constants/enum/skill.enum';

export interface ISession extends IBaseEntity {
  id: number;
  location: string;
  name: string;
  date: string;
  time: string;
  skillLevels: SkillLevel[];
  spotsAvailable: number;
  spotsTotal: number;
  status: SessionStatus;
  notes?: string;
  registration: Registration;
}

export interface ISessionCreate {
  location: string;
  name: string;
  date: string;
  time: string;
  skillLevels: SkillLevel[];
  spotsAvailable: number;
  spotsTotal: number;
  status?: SessionStatus;
  notes?: string;
  registration?: Registration;
}

export interface ISessionPaginateQuery extends IPaginateQuery {
  sortOptions: ISortOption[];
  search?: string;
  location?: string;
  skillLevels?: SkillLevel[];
  date?: string;
  hasSpots?: boolean;
}

export interface ISessionCountResponse {
  count: number;
}

// Common sorting scenarios
const sortExamples = [
  { date: 'ASC', time: 'ASC' }, // Chronological order
  { location: 'ASC' }, // Group by location
  { spotsAvailable: 'DESC' }, // Most available spots first
];
