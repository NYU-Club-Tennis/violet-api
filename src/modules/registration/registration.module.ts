import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { RegistrationService } from './services/registration.service';
import { RegistrationController } from './controllers/registration.controller';
import { Registration } from './entities/registration.entity';
import { Session } from '../session/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, Session]),
    SessionModule,
    UserModule,
  ],
  providers: [RegistrationService],
  controllers: [RegistrationController],
  exports: [RegistrationService],
})
export class RegistrationsModule {}
