import {
  IBaseEntity,
  IPaginateQuery,
  ISortOption,
} from 'src/common/interfaces/common.interface';

export interface IUser extends IBaseEntity {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  noShowCount: number;
  lastSignInAt?: string;
}

export type IUserCreate = Omit<IUser, 'id'>;

export interface IUserPaginateQuery extends IPaginateQuery {
  sortOptions?: ISortOption[];
  search?: string;
}

export interface IUserCountResponse {
  count: number;
}
