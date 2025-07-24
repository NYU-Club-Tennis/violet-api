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
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IPaginateResponse,
  ISortOption,
} from 'src/common/interfaces/common.interface';

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
