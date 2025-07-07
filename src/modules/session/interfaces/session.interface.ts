import {
  IBaseEntity,
  IPaginateQuery,
  ISortOption,
} from 'src/common/interfaces/common.interface';

export interface ISession extends IBaseEntity {
  id: number;
  location: string;
  name: string;
  date: string;
  skillLevel: string;
  time: string;
  spotsAvailable: number;
  spotsTotal: number;
}

export type ISessionCreate = Omit<ISession, 'id'>;

export interface ISessionPaginateQuery extends IPaginateQuery {
  sortOptions: ISortOption[];
  location?: string;
  skillLevel?: string;
  date?: string;
  hasSpots?: boolean;
}

// Common sorting scenarios
const sortExamples = [
  { date: 'ASC', time: 'ASC' }, // Chronological order
  { location: 'ASC' }, // Group by location
  { spotsAvailable: 'DESC' }, // Most available spots first
  { skillLevel: 'ASC' }, // By skill level
];
