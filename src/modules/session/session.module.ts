import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionService } from './services/session.service';
import { SessionSchedulerService } from './services/session-scheduler.service';
import { SessionController } from './controllers/session.controller';
import { Session } from './entities/session.entity';
import { Registration } from '../registration/entities/registration.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Registration]),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    MailModule,
  ],
  providers: [SessionService, SessionSchedulerService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
