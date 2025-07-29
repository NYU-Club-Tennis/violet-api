import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Attachment } from 'nodemailer/lib/mailer';

export class SendMailDto {
  @ApiProperty({
    description: 'Email recipient(s)',
    example: ['user@example.com'],
    type: [String],
    isArray: true,
  })
  @IsEmail({}, { each: true })
  @IsArray()
  @Type(() => String)
  to: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to NYU Tennis Club',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description: 'Plain text content of the email',
    example: 'Welcome to NYU Tennis Club!',
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email',
    example: '<h1>Welcome to NYU Tennis Club!</h1>',
  })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({
    description: 'Email attachments',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @IsOptional()
  attachments?: Attachment[];
}

export class SendWelcomeEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsString()
  name: string;
}

export class SessionDetailsDto {
  @ApiProperty({
    description: 'Session date',
    example: '2024-03-20',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Session time',
    example: '14:00',
  })
  @IsString()
  time: string;

  @ApiProperty({
    description: 'Session location',
    example: 'NYU Tennis Courts',
  })
  @IsString()
  location: string;
}

export class SendSessionConfirmationDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Session details',
    type: SessionDetailsDto,
  })
  @ValidateNested()
  @Type(() => SessionDetailsDto)
  sessionDetails: SessionDetailsDto;
}

export class BulkAnnouncementDto {
  @ApiProperty({
    description: 'List of recipient email addresses',
    example: ['user1@nyu.edu', 'user2@nyu.edu'],
    type: [String],
    isArray: true,
  })
  @IsEmail({}, { each: true })
  @IsArray()
  @Type(() => String)
  emails: string[];

  @ApiProperty({
    description: 'Email header text (appears below the NYU Tennis Club banner)',
    example: 'Important Session Announcement!',
  })
  @IsString()
  @IsNotEmpty()
  header: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Session Update - Advanced Tennis - March 20, 2024 at NYU Courts',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email body content (plain text)',
    example:
      'Hello everyone! Just wanted to remind you about our upcoming tennis session...',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}
