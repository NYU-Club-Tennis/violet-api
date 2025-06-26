import { Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';
import { AppLogger } from '../logger/logger.service';

@Module({
  imports: [],
  controllers: [MailController],
  providers: [MailService, AppLogger],
  exports: [MailService],
})
export class MailModule {}
