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
} from 'class-validator';
import { SkillLevel } from 'src/constants/enum/skill.enum';

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
    description: 'Skill level required for the session',
    enum: SkillLevel,
    example: SkillLevel.Intermediate,
  })
  @IsEnum(SkillLevel)
  @IsNotEmpty()
  skillLevel: SkillLevel;

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
    description: 'Skill level required for the session',
    enum: SkillLevel,
    example: SkillLevel.Intermediate,
    required: false,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

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
