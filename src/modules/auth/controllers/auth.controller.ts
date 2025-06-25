import { Controller } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { env } from 'src/constants/environment.constant';
import { UserService } from 'src/modules/user/services/user.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly salt: number = env.salt;
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }
}
