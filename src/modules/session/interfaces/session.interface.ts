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
}
