import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import { AuthGuard } from 'src/middleware/guards/auth.guard';
import { Roles } from 'src/middleware/decorators/roles.decorator';
import { Role } from 'src/constants/enum/roles.enum';
import {
  UserCountResponseDto,
  UserPaginateQueryDto,
  UserPaginateResponseDto,
} from '../dto/users.dto';

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

  @Get('paginate')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get paginated users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
    type: UserPaginateResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async getUsersPaginate(
    @Query() query: UserPaginateQueryDto,
  ): Promise<UserPaginateResponseDto> {
    const [users, total] = await this.userService.findPaginate(query);

    // Map User entities to UserResponseDto
    const data = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      noShowCount: user.noShowCount,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || '',
    }));

    return { data, total };
  }

  @Get('count')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get total users count (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns total number of registered users',
    type: UserCountResponseDto,
  })
  async getTotalUsersCount(): Promise<UserCountResponseDto> {
    return this.userService.getTotalUsersCount();
  }
}
