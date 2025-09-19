import { Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';
import { AppLogger } from '../logger/logger.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [MailController],
  providers: [MailService, AppLogger],
  exports: [MailService],
})
export class MailModule {}
