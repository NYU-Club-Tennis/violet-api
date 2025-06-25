import { Controller } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AppLogger } from 'src/modules/logger/logger.service';

import * as dayjs from 'dayjs';
import { RegistrationService } from 'src/modules/registration/services/registration.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
@ApiBearerAuth()
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
    private readonly registrationService: RegistrationService,
  ) {
    this.logger.setContext(UserController.name);
  }
}
