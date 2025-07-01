import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserDTO } from 'src/modules/user/dto/users.dto';

export class UserSignupRequestDTO {
  @ApiProperty({
    description: 'User email',
    example: 'john.doe@nyu.edu',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'student@nyu.edu',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'yourpassword123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDTO {
  @ApiProperty({
    description: 'Authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Refresh token for getting new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserDTO,
  })
  user: UserDTO;
}

export class AuthTokenCheckDTO {
  @ApiProperty({
    description: 'Token to check',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class IAuthCreateProfileRequestDTO {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email',
    example: 'john.doe@nyu.edu',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Password',
    example: 'password',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RotateRefreshTokenDTO {
  @ApiProperty({
    description: 'Refresh token for renew access token. ',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class TokenRefreshResponseDTO extends PickType(AuthResponseDTO, [
  'token',
  'refreshToken',
]) {}
