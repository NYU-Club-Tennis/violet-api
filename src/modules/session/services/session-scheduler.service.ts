import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from './session.service';

@Injectable()
export class SessionSchedulerService {
  private readonly logger = new Logger(SessionSchedulerService.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Automatically close past sessions every day at 1:00 AM
   * This ensures that sessions that have passed their date are marked as CLOSED
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleClosePastSessions() {
    this.logger.log('Starting scheduled task: Close past sessions');

    try {
      const result = await this.sessionService.closePastSessions();
      this.logger.log(`Scheduled task completed: ${result.message}`);
    } catch (error) {
      this.logger.error('Scheduled task failed: Close past sessions', error);
    }
  }

  /**
   * Optional: Also run this task every hour for more frequent updates
   * Uncomment this method if you want more frequent session status updates
   */
  // @Cron(CronExpression.EVERY_HOUR)
  // async handleClosePastSessionsHourly() {
  //   this.logger.log('Starting hourly task: Close past sessions');
  //
  //   try {
  //     const result = await this.sessionService.closePastSessions();
  //     if (result.closedCount > 0) {
  //       this.logger.log(`Hourly task completed: ${result.message}`);
  //     }
  //   } catch (error) {
  //     this.logger.error('Hourly task failed: Close past sessions', error);
  //   }
  // }
}
