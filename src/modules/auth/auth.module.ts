import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'src/constants/environment.constant';
import { UserModule } from '../user/user.module';
import { LoggerModule } from '../logger/logger.module';
import { MailModule } from '../mail/mail.module';
import { UserService } from '../user/services/user.service';
import { JwtStrategy } from 'src/middleware/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.jwt.accessTokenSecret,
      signOptions: { expiresIn: '15m' },
    }),
    UserModule,
    LoggerModule,
    MailModule,
  ],
  providers: [AuthService, UserService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
