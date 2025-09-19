import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { Session } from '../entities/session.entity';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionResponseDto,
  SessionPaginateQueryRequestDTO,
  SessionPaginateQueryResponseDTO,
  SessionCountResponseDto,
} from '../dto/session.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/middleware/guards/auth.guard';
import { Roles } from 'src/middleware/decorators/roles.decorator';
import { Role } from 'src/constants/enum/roles.enum';
import { Request } from '@nestjs/common';

@ApiTags('Sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({
    status: 201,
    description: 'The session has been successfully created.',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async createSession(@Body() sessionData: CreateSessionDto): Promise<Session> {
    return this.sessionService.create(sessionData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all sessions',
    type: [SessionResponseDto],
  })
  async findAll(): Promise<Session[]> {
    return this.sessionService.findAll();
  }

  @Get('paginate')
  @ApiOperation({ summary: 'Get paginated sessions' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated sessions',
    type: SessionPaginateQueryResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findPaginate(
    @Query()
    query: SessionPaginateQueryRequestDTO,
  ): Promise<SessionPaginateQueryResponseDTO> {
    try {
      const [data, total] = await this.sessionService.findPaginate(query);
      return { data, total };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by id' })
  @ApiResponse({
    status: 200,
    description: 'Returns the session',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async findOne(@Param('id') id: string): Promise<Session> {
    return this.sessionService.findOne(+id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a session' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully updated.',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async updateSession(
    @Param('id') id: string,
    @Body() updateData: UpdateSessionDto,
  ): Promise<Session> {
    return this.sessionService.update(+id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully deleted.',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async deleteSession(@Param('id') id: string): Promise<Session> {
    return this.sessionService.deleteOne(+id);
  }

  @Get('active/count')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions count (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns total number of active sessions (status = OPEN)',
    type: SessionCountResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async getActiveSessionsCount(): Promise<SessionCountResponseDto> {
    return this.sessionService.getActiveSessionsCount();
  }

  @Get('user/:userId/:type')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user sessions by type (upcoming or past)' })
  @ApiResponse({
    status: 200,
    description: 'Returns user sessions',
    type: [SessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid type parameter.' })
  async getUserSessions(
    @Param('userId') userId: string,
    @Param('type') type: string,
  ): Promise<Session[]> {
    if (type !== 'upcoming' && type !== 'past') {
      throw new Error('Type must be either "upcoming" or "past"');
    }
    return this.sessionService.getUserSessions(
      +userId,
      type as 'upcoming' | 'past',
    );
  }

  @Delete(':sessionId/registration')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel session registration for current user' })
  @ApiResponse({
    status: 200,
    description: 'Registration cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Registration not found.' })
  async cancelSessionRegistration(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    return this.sessionService.cancelSessionRegistration(+sessionId, userId);
  }

  @Post(':id/archive')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a session (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session archived',
    type: SessionResponseDto,
  })
  async archive(@Param('id') id: string): Promise<Session> {
    return this.sessionService.archive(+id);
  }

  @Post(':id/unarchive')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unarchive a session (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session unarchived',
    type: SessionResponseDto,
  })
  async unarchive(@Param('id') id: string): Promise<Session> {
    return this.sessionService.unarchive(+id);
  }

  @Post('archive-past-sessions')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger archiving of past sessions' })
  @ApiResponse({
    status: 200,
    description: 'Past sessions have been closed successfully',
    schema: {
      type: 'object',
      properties: {
        archivedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin access.',
  })
  async archivePastSessions(): Promise<{
    archivedCount: number;
    message: string;
  }> {
    return this.sessionService.autoArchivePastSessions();
  }
}
