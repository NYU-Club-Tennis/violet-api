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
}
