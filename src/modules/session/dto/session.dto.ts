import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
  Matches,
  IsOptional,
  IsArray,
} from 'class-validator';
import { SkillLevel } from 'src/constants/enum/skill.enum';
import { SessionStatus } from 'src/constants/enum/session.enum';
import {
  ISession,
  ISessionPaginateQuery,
} from '../interfaces/session.interface';
import {
  IPaginateResponse,
  ISortOption,
} from 'src/common/interfaces/common.interface';
import { Type } from 'class-transformer';
import { Registration } from 'src/modules/registration/entities/registration.entity';

export class SessionDTO implements ISession {
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Location where the session will be held',
    example: 'NYU Tennis Courts',
    type: String,
  })
  location: string;

  @ApiProperty({
    description: 'Name of the session',
    example: 'Sunday Morning Tennis',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Date of the session in ISO format',
    example: '2024-03-20',
    type: String,
  })
  date: string;

  @ApiProperty({
    description: 'Skill levels allowed for the session',
    enum: SkillLevel,
    isArray: true,
    example: [SkillLevel.Intermediate, SkillLevel.Advanced],
  })
  skillLevels: SkillLevel[];

  @ApiProperty({
    description: 'Time of the session in 24-hour format (HH:mm)',
    example: '14:00',
    type: String,
  })
  time: string;

  @ApiProperty({
    description: 'Number of spots currently available',
    example: 12,
    type: Number,
    minimum: 0,
  })
  spotsAvailable: number;

  @ApiProperty({
    description: 'Total number of spots available for the session',
    example: 12,
    type: Number,
    minimum: 1,
  })
  spotsTotal: number;

  @ApiProperty({
    description: 'Status of the session',
    enum: SessionStatus,
    example: SessionStatus.OPEN,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Additional notes about the session',
    example: 'Please bring your own racket. Water will be provided.',
    type: String,
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Registration information for the session',
    type: () => Registration,
  })
  registration: Registration;
}

export class CreateSessionDto {
  @ApiProperty({
    description: 'Name of the session',
    example: 'Sunday Morning Tennis',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Location where the session will be held',
    example: 'NYU Tennis Courts',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Date of the session in ISO format',
    example: '2024-03-20',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Time of the session in 24-hour format (HH:mm)',
    example: '14:00',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in 24-hour format (HH:mm)',
  })
  time: string;

  @ApiProperty({
    description: 'Skill levels allowed for the session',
    enum: SkillLevel,
    isArray: true,
    example: [SkillLevel.Intermediate, SkillLevel.Advanced],
  })
  @IsArray()
  @IsEnum(SkillLevel, { each: true })
  @IsNotEmpty()
  skillLevels: SkillLevel[];

  @ApiProperty({
    description: 'Total number of spots available for the session',
    example: 12,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  spotsTotal: number;

  @ApiProperty({
    description: 'Number of spots currently available',
    example: 12,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  spotsAvailable: number;

  @ApiProperty({
    description: 'Status of the session',
    enum: SessionStatus,
    example: SessionStatus.OPEN,
    default: SessionStatus.OPEN,
  })
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @ApiProperty({
    description: 'Additional notes about the session',
    example: 'Please bring your own racket. Water will be provided.',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSessionDto {
  @ApiProperty({
    description: 'Name of the session',
    example: 'Sunday Morning Tennis',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Location where the session will be held',
    example: 'NYU Tennis Courts',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description: 'Date of the session in ISO format',
    example: '2024-03-20',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Time of the session in 24-hour format (HH:mm)',
    example: '14:00',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in 24-hour format (HH:mm)',
  })
  time?: string;

  @ApiProperty({
    description: 'Skill levels allowed for the session',
    enum: SkillLevel,
    isArray: true,
    example: [SkillLevel.Intermediate, SkillLevel.Advanced],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SkillLevel, { each: true })
  skillLevels?: SkillLevel[];

  @ApiProperty({
    description: 'Total number of spots available for the session',
    example: 12,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  spotsTotal?: number;

  @ApiProperty({
    description: 'Number of spots currently available',
    example: 12,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spotsAvailable?: number;

  @ApiProperty({
    description: 'Status of the session',
    enum: SessionStatus,
    example: SessionStatus.OPEN,
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({
    description: 'Additional notes about the session',
    example: 'Please bring your own racket. Water will be provided.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SessionResponseDto extends CreateSessionDto {
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Timestamp when the session was created',
    example: '2024-03-15T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp when the session was last updated',
    example: '2024-03-15T10:00:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Timestamp when the session was deleted (if applicable)',
    example: null,
    nullable: true,
  })
  deletedAt?: string;
}

export class SessionPaginateQueryResponseDTO
  implements IPaginateResponse<SessionDTO>
{
  @ApiProperty({
    description: 'Array of sessions',
    example: [SessionDTO],
    type: () => [SessionDTO],
  })
  @IsArray()
  data: SessionDTO[];

  @ApiProperty({
    description:
      'Total of Players found with the page and limit sent, will be use to calculated total page for Pagination component.',
    example: 10,
    type: Number,
  })
  @IsNumber()
  total: number;
}

export class SessionPaginateQueryRequestDTO implements ISessionPaginateQuery {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    type: Number,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiProperty({
    description: 'Optional search term',
    example: 'Tennis',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sort options for the query',
    example: [{ createdAt: 'DESC' }],
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    required: false,
  })
  @IsArray()
  @IsOptional()
  sortOptions: ISortOption[];
}

export class SessionCountResponseDto {
  @ApiProperty({
    description: 'Total number of active sessions (status = OPEN)',
    example: 24,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  count: number;
}
