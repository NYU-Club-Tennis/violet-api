import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Get,
  UseGuards,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { RegistrationService } from '../services/registration.service';
import { AuthGuard } from 'src/middleware/guards/auth.guard';
import { Roles } from 'src/middleware/decorators/roles.decorator';
import { Role } from 'src/constants/enum/roles.enum';
import {
  CreateRegistrationDto,
  MarkAttendanceDto,
  RegistrationResponseDto,
  GetRegistrationHistoryQueryDto,
} from '../dto/registration.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Registration')
@Controller('registration')
@UseGuards(AuthGuard)
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Register for a session' })
  @ApiResponse({
    status: 201,
    description: 'Successfully registered for session',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User already registered for this session',
  })
  async registerForSession(
    @Body() createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationService.create(
      createRegistrationDto.userId,
      createRegistrationDto.sessionId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a registration' })
  @ApiResponse({
    status: 200,
    description: 'Registration successfully cancelled',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Registration not found',
  })
  async cancelRegistration(
    @Param('id') id: number,
  ): Promise<RegistrationResponseDto> {
    return this.registrationService.cancel(id);
  }

  @Get('session/:sessionId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all registrations for a session (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of registrations for the session',
    type: [RegistrationResponseDto],
  })
  async getSessionRegistrations(
    @Param('sessionId') sessionId: number,
  ): Promise<RegistrationResponseDto[]> {
    return this.registrationService.getRegistrationsBySession(sessionId);
  }

  @Get('session/:sessionId/waitlist')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get waitlist for a session (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users on the waitlist',
    type: [RegistrationResponseDto],
  })
  async getSessionWaitlist(
    @Param('sessionId') sessionId: number,
  ): Promise<RegistrationResponseDto[]> {
    return this.registrationService.getWaitlistBySession(sessionId);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get registration history for a user' })
  @ApiResponse({
    status: 200,
    description: 'User registration history',
    type: [RegistrationResponseDto],
  })
  async getUserRegistrations(
    @Request() req,
    @Param('userId') userId: number,
    @Query() query: GetRegistrationHistoryQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    // Only allow admins to view other users' registrations
    if (userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Cannot view other users registrations');
    }
    return this.registrationService.getUserRegistrationHistory(userId, query);
  }

  @Get('current')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user registration history' })
  @ApiResponse({
    status: 200,
    description: 'Current user registration history',
    type: [RegistrationResponseDto],
  })
  async getCurrentUserRegistrations(
    @Request() req,
    @Query() query: GetRegistrationHistoryQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    return this.registrationService.getUserRegistrationHistory(
      req.user.id,
      query,
    );
  }

  @Post(':id/attendance')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mark attendance for a registration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Attendance marked successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Registration not found',
  })
  async markAttendance(
    @Param('id') id: number,
    @Body() markAttendanceDto: MarkAttendanceDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationService.markAttendance(
      id,
      markAttendanceDto.hasAttended,
    );
  }
}
