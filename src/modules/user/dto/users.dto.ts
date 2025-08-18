import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IPaginateResponse,
  ISortOption,
} from 'src/common/interfaces/common.interface';
import { Role } from 'src/constants/enum/roles.enum';
import { MembershipLevel } from 'src/constants/enum/membership.enum';

export class UserDTO {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@nyu.edu',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1 (555) 123-4567',
    type: String,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    type: String,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Whether the user is an admin',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsBoolean()
  isAdmin: boolean;

  @ApiProperty({
    description: 'User membership level',
    enum: MembershipLevel,
    example: MembershipLevel.USER,
    default: MembershipLevel.USER,
  })
  @IsEnum(MembershipLevel)
  membershipLevel: MembershipLevel;

  @ApiProperty({
    description:
      'Number of times the user has not shown up to registered sessions',
    example: 0,
    type: Number,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  noShowCount: number;
}

export class UserCountResponseDto {
  @ApiProperty({
    description: 'Total number of registered users',
    example: 150,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  count: number;
}

export class UserPaginateQueryDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({
    description: 'Search term for filtering users by name or email',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort options for ordering results',
    example: [{ createdAt: 'DESC' }],
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  sortOptions?: ISortOption[];
}

export class UserResponseDto extends UserDTO {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2024-03-15T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2024-03-15T10:00:00Z',
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the user last signed in',
    example: '2024-03-15T10:00:00Z',
    nullable: true,
  })
  lastSignInAt?: string;
}

export class UserPaginateResponseDto
  implements IPaginateResponse<UserResponseDto>
{
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 150,
  })
  total: number;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class UpdateMembershipLevelDto {
  @ApiProperty({
    description: 'New membership level for the user',
    enum: MembershipLevel,
    example: MembershipLevel.MEMBER,
  })
  @IsEnum(MembershipLevel)
  @IsNotEmpty()
  membershipLevel: MembershipLevel;
}

export class UserSearchQueryDto {
  @ApiProperty({
    description: 'Search term to find users by name or email',
    example: 'john',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class UserSearchItemDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@nyu.edu',
  })
  email: string;
}

export class UserSearchResponseDto {
  @ApiProperty({
    description: 'Array of matching users',
    type: [UserSearchItemDto],
  })
  users: UserSearchItemDto[];
}

export class EmailsByRolesQueryDto {
  @ApiProperty({
    description: 'Array of roles to get emails for',
    enum: Role,
    isArray: true,
    example: [Role.USER, Role.ADMIN],
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];
}

export class EmailsByRolesResponseDto {
  @ApiProperty({
    description: 'Array of email addresses for the requested roles',
    example: ['user1@nyu.edu', 'user2@nyu.edu'],
    type: [String],
    isArray: true,
  })
  emails: string[];
}

export class UserExistsResponseDto {
  @ApiProperty({
    description: 'Whether a user with this email exists',
    example: true,
  })
  exists: boolean;
}
