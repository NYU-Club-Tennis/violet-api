export interface IBaseEntity {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
export interface IPaginateQuery {
  page: number;
  limit: number;
}

export interface IPaginateResponse<T> {
  data: T[];
  total: number;
}

export interface ISortOption {
  [key: string]: string;
}

export interface IDateQuery {
  startDate: string;
  endDate: string;
}

export interface IFileUploadResponse {
  originalName: string;
  fullURL: string;
}

export interface IImageDescription {
  imageUrl: string;
  description: string;
}
