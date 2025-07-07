import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import { AuthGuard } from 'src/middleware/guards/auth.guard';

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
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserController.name);
  }

  @Get('current')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user data' })
  @ApiResponse({ status: 200, description: 'Returns current user data' })
  async getCurrentUser(@Request() req) {
    const user = await this.userService.findById(req.user.id);
    return user;
  }
}
