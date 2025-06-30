import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { RegistrationStatus } from '../interfaces/registration.interface';

export class RegistrationDTO {
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

  @ApiProperty({
    description:
      'Position in registration/waitlist (0 = registered, 1+ = waitlist position)',
    example: 0,
    type: Number,
    default: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  position: number;

  @ApiProperty({
    description: 'Number of times user has registered for sessions',
    example: 1,
    type: Number,
    default: 1,
  })
  @IsNumber()
  registrationCount: number;

  @ApiProperty({
    description: 'Date of last cancellation',
    example: '2024-03-15T10:00:00Z',
    type: Date,
    required: false,
  })
  @IsDate()
  @IsOptional()
  lastCancellation?: Date;

  @ApiProperty({
    description: 'Whether the user has attended the session',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsBoolean()
  hasAttended: boolean;

  @ApiProperty({
    description: 'Status of the registration',
    enum: RegistrationStatus,
    example: RegistrationStatus.REGISTERED,
    default: RegistrationStatus.REGISTERED,
  })
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;
}

export class UpdateRegistrationDTO {
  @ApiProperty({
    description: 'Position in registration/waitlist',
    example: 0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiProperty({
    description: 'Whether the user has attended the session',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  hasAttended?: boolean;

  @ApiProperty({
    description: 'Status of the registration',
    enum: RegistrationStatus,
    example: RegistrationStatus.COMPLETED,
    required: false,
  })
  @IsEnum(RegistrationStatus)
  @IsOptional()
  status?: RegistrationStatus;
}
