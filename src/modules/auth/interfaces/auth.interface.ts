import { IUser } from 'src/modules/user/interfaces/user.interface';

export interface IAuthLoginRequest {
  email: string;
  password: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IAuthCreateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface IAuthValidateCodeResponse {
  email: string;
}

export interface IAuthUser
  extends Pick<
    IUser,
    | 'id'
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'phoneNumber'
    | 'avatarUrl'
    | 'noShowCount'
    | 'isAdmin'
  > {}

export interface ISignTokenPayload {
  id: number;
  email: string;
  isAdmin: boolean;
}
