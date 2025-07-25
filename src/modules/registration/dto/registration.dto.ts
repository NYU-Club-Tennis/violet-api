import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDate,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { RegistrationStatus } from '../interfaces/registration.interface';
import { Type } from 'class-transformer';

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Session ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;
}

export class MarkAttendanceDto {
  @ApiProperty({
    description: 'Whether the user has attended the session',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  @IsNotEmpty()
  hasAttended: boolean;
}

export class UserInfoDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    type: String,
  })
  lastName: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@nyu.edu',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1 (555) 123-4567',
    type: String,
    required: false,
    nullable: true,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'User no-show count',
    example: 0,
    type: Number,
  })
  noShowCount: number;
}

export class RegistrationResponseDto {
  @ApiProperty({
    description: 'Registration ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'Session ID',
    example: 1,
    type: Number,
  })
  sessionId: number;

  @ApiProperty({
    description:
      'Position in registration/waitlist (0 = registered, 1+ = waitlist position)',
    example: 0,
    type: Number,
  })
  position: number;

  @ApiProperty({
    description: 'Whether the user has attended the session',
    example: false,
    type: Boolean,
  })
  hasAttended: boolean;

  @ApiProperty({
    description: 'Status of the registration',
    enum: RegistrationStatus,
    example: RegistrationStatus.REGISTERED,
  })
  status: RegistrationStatus;

  @ApiProperty({
    description: 'Date of last cancellation',
    example: '2024-03-15T10:00:00Z',
    type: Date,
    required: false,
    nullable: true,
  })
  lastCancellation: Date | null;

  @ApiProperty({
    description: 'User information',
    type: UserInfoDto,
    required: false,
  })
  user?: UserInfoDto;

  @ApiProperty({
    description: 'Registration creation date',
    example: '2024-03-15T10:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Registration last update date',
    example: '2024-03-15T10:00:00Z',
    type: Date,
  })
  updatedAt: Date;
}

export class SessionRegistrationsResponseDto {
  @ApiProperty({
    description: 'Array of registrations for the session',
    type: [RegistrationResponseDto],
  })
  data: RegistrationResponseDto[];
}

export class ActiveRegistrationsCountResponseDto {
  @ApiProperty({
    description: 'Total number of active registrations (for future sessions)',
    example: 89,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  count: number;
}

export class GetRegistrationHistoryQueryDto {
  @ApiProperty({
    description: 'Filter by registration status',
    enum: RegistrationStatus,
    isArray: true,
    required: false,
    example: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED],
  })
  @IsOptional()
  @IsEnum(RegistrationStatus, { each: true })
  @IsArray()
  @Type(() => String)
  status?: RegistrationStatus[];

  @ApiProperty({
    description: 'Only return registrations for sessions after this date',
    required: false,
    example: '2024-03-15',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  afterDate?: Date;

  @ApiProperty({
    description: 'Include session details in the response',
    required: false,
    default: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSession?: boolean;

  @ApiProperty({
    description: 'Include user details in the response',
    required: false,
    default: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeUser?: boolean;
}
