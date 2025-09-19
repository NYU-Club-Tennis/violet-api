import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from './session.service';

@Injectable()
export class SessionSchedulerService {
  private readonly logger = new Logger(SessionSchedulerService.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Automatically archive past sessions every day at 1:00 AM
   * This ensures that sessions that have passed their date are marked as archived
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleArchivePastSessions() {
    this.logger.log('Starting scheduled task: Archive past sessions');

    try {
      const result = await this.sessionService.autoArchivePastSessions();
      this.logger.log(`Scheduled task completed: ${result.message}`);
    } catch (error) {
      this.logger.error('Scheduled task failed: Archive past sessions', error);
    }
  }

  /**
   * Optional: Also run this task every hour for more frequent updates
   * Uncomment this method if you want more frequent session status updates
   */
  // @Cron(CronExpression.EVERY_HOUR)
  // async handleArchivePastSessionsHourly() {
  //   this.logger.log('Starting hourly task: Archive past sessions');
  //
  //   try {
  //     const result = await this.sessionService.autoArchivePastSessions();
  //     if (result.closedCount > 0) {
  //       this.logger.log(`Hourly task completed: ${result.message}`);
  //     }
  //   } catch (error) {
  //     this.logger.error('Hourly task failed: Archive past sessions', error);
  //   }
  // }
}
