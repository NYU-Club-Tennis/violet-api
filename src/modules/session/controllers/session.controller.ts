import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { Session } from '../entities/session.entity';

@Controller('Session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async createSession(@Body() sessionData: Partial<Session>): Promise<Session> {
    return this.sessionService.create(sessionData);
  }

  @Get()
  async findAll(): Promise<Session[]> {
    return this.sessionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Session> {
    return this.sessionService.findOne(+id);
  }
}
