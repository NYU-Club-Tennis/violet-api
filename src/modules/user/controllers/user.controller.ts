import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Param,
  Body,
  Patch,
  BadRequestException,
} from '@nestjs/common';
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
  UserResponseDto,
  UpdateUserRoleDto,
  EmailsByRolesResponseDto,
  UpdateMembershipLevelDto,
  UpdateUserBanStatusDto,
  UserSearchQueryDto,
  UserSearchResponseDto,
  UserExistsResponseDto,
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

  @Get('exists')
  @ApiOperation({ summary: 'Check if a user exists by email' })
  @ApiResponse({
    status: 200,
    description: 'Whether a user exists with this email',
    type: UserExistsResponseDto,
  })
  async checkUserExists(
    @Query('email') email: string,
  ): Promise<UserExistsResponseDto> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const exists = await this.userService.isEmailExisted(email);
    return { exists };
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
      membershipLevel: user.membershipLevel,
      noShowCount: user.noShowCount,
      isBanned: user.isBanned,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || '',
      avatarUrl: user.avatarUrl,
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

  @Patch(':id/role')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUserRole(
    @Param('id') id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Request() req,
  ): Promise<UserResponseDto> {
    // Prevent users from changing their own role
    if (req.user.id === id) {
      throw new BadRequestException(
        'You cannot change your own role. Please ask another admin to do this for you.',
      );
    }

    const updatedUser = await this.userService.updateUserRole(
      id,
      updateUserRoleDto.role === Role.ADMIN,
    );

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
      membershipLevel: updatedUser.membershipLevel,
      noShowCount: updatedUser.noShowCount,
      isBanned: updatedUser.isBanned,
      lastSignInAt: updatedUser.lastSignInAt,
      createdAt: updatedUser.createdAt || '',
      updatedAt: updatedUser.updatedAt || '',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  @Patch(':id/membership-level')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user membership level (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User membership level updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async updateMembershipLevel(
    @Param('id') id: number,
    @Body() updateMembershipLevelDto: UpdateMembershipLevelDto,
    @Request() req,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateMembershipLevel(
      id,
      updateMembershipLevelDto.membershipLevel,
    );

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
      membershipLevel: updatedUser.membershipLevel,
      noShowCount: updatedUser.noShowCount,
      isBanned: updatedUser.isBanned,
      lastSignInAt: updatedUser.lastSignInAt,
      createdAt: updatedUser.createdAt || '',
      updatedAt: updatedUser.updatedAt || '',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  @Patch(':id/ban-status')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user ban status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User ban status updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUserBanStatus(
    @Param('id') id: number,
    @Body() updateUserBanStatusDto: UpdateUserBanStatusDto,
    @Request() req,
  ): Promise<UserResponseDto> {
    // Prevent users from changing their own ban status
    if (req.user.id === id) {
      throw new BadRequestException(
        'You cannot change your own ban status. Please ask another admin to do this for you.',
      );
    }

    const updatedUser = await this.userService.updateUserBanStatus(
      id,
      updateUserBanStatusDto.isBanned,
    );

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
      membershipLevel: updatedUser.membershipLevel,
      noShowCount: updatedUser.noShowCount,
      isBanned: updatedUser.isBanned,
      lastSignInAt: updatedUser.lastSignInAt,
      createdAt: updatedUser.createdAt || '',
      updatedAt: updatedUser.updatedAt || '',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update user profile information' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only update their own profile.',
  })
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: Partial<UserResponseDto>,
    @Request() req,
  ): Promise<UserResponseDto> {
    // Ensure users can only update their own profile
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new BadRequestException('You can only update your own profile');
    }

    const updatedUser = await this.userService.update(id, updateUserDto);

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
      membershipLevel: updatedUser.membershipLevel,
      noShowCount: updatedUser.noShowCount,
      isBanned: updatedUser.isBanned,
      lastSignInAt: updatedUser.lastSignInAt,
      createdAt: updatedUser.createdAt || '',
      updatedAt: updatedUser.updatedAt || '',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  @Get('emails-by-roles')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user emails by roles (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of email addresses for the specified roles',
    type: EmailsByRolesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async getUserEmailsByRoles(
    @Query('roles') roles: string | string[],
  ): Promise<EmailsByRolesResponseDto> {
    // Handle different array formats
    let roleArray: string[];

    if (Array.isArray(roles)) {
      roleArray = roles;
    } else if (typeof roles === 'string') {
      // Handle comma-separated string or single value
      roleArray = roles.split(',').map((r) => r.trim());
    } else {
      roleArray = [];
    }

    const emails = await this.userService.getUserEmailsByRoles(roleArray);

    return { emails };
  }

  @Get('club-members')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all club member emails (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of email addresses for all club members',
    type: EmailsByRolesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async getAllClubMembers(): Promise<EmailsByRolesResponseDto> {
    const emails = await this.userService.getAllClubMembers();

    return { emails };
  }

  @Get('search')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Search users by name or email (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of matching users',
    type: UserSearchResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async searchUsers(
    @Query() searchQuery: UserSearchQueryDto,
  ): Promise<UserSearchResponseDto> {
    const users = await this.userService.searchUsers(
      searchQuery.query,
      searchQuery.limit || 10,
    );

    const userResults = users.map((user) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }));

    return { users: userResults };
  }
}
