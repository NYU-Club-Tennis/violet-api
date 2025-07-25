import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  SendMailDto,
  SendWelcomeEmailDto,
  SendSessionConfirmationDto,
} from '../dtos/mail.dto';
import { IMailResponse } from '../interfaces/mail.interface';

@ApiBearerAuth()
@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MailController.name);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a custom email' })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    type: Object,
  })
  async sendMail(@Body() dto: SendMailDto): Promise<IMailResponse> {
    return this.mailService.sendMail(dto);
  }

  @Post('welcome')
  @ApiOperation({ summary: 'Send a welcome email' })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
    type: Object,
  })
  async sendWelcomeEmail(
    @Body() dto: SendWelcomeEmailDto,
  ): Promise<IMailResponse> {
    return this.mailService.sendWelcomeEmail(dto);
  }

  @Post('session-confirmation')
  @ApiOperation({ summary: 'Send a session confirmation email' })
  @ApiResponse({
    status: 200,
    description: 'Session confirmation email sent successfully',
    type: Object,
  })
  async sendSessionConfirmation(
    @Body() dto: SendSessionConfirmationDto,
  ): Promise<IMailResponse> {
    return this.mailService.sendSessionConfirmation(dto);
  }

  @ApiOperation({ summary: 'Test verification email template' })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
  })
  @Post('test/verification')
  async testVerificationEmail() {
    return this.mailService.sendVerificationEmail(
      'test@nyu.edu',
      'test-token-12345',
    );
  }
}
