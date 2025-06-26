import { Injectable } from '@nestjs/common';
import { env } from 'src/constants/environment.constant';
import * as nodemailer from 'nodemailer';
import { AppLogger } from 'src/modules/logger/logger.service';
import {
  IMailOptions,
  IMailResponse,
  ISessionDetails,
} from '../interfaces/mail.interface';
import {
  SendMailDto,
  SendWelcomeEmailDto,
  SendSessionConfirmationDto,
} from '../dtos/mail.dto';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(MailService.name);
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure, // true for 465, false for other ports
      auth: {
        user: env.mail.user,
        pass: env.mail.pass,
      },
      service: 'gmail', // Specify the email service
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
  }

  async sendMail(options: SendMailDto): Promise<IMailResponse> {
    try {
      const mailOptions: IMailOptions = {
        from: env.mail.from ?? 'noreply@nyutennis.com',
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  async sendWelcomeEmail(dto: SendWelcomeEmailDto): Promise<IMailResponse> {
    const { to, name } = dto;
    const subject = 'Welcome to NYU Tennis Club!';
    const html = `
      <h1>Welcome to NYU Tennis Club, ${name}!</h1>
      <p>We're excited to have you join our community.</p>
      <p>You can now:</p>
      <ul>
        <li>Register for tennis sessions</li>
        <li>Join club events</li>
        <li>Connect with other tennis enthusiasts</li>
      </ul>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p>Best regards,<br>NYU Tennis Club Team</p>
    `;

    return this.sendMail({ to: [to], subject, html });
  }

  async sendSessionConfirmation(
    dto: SendSessionConfirmationDto,
  ): Promise<IMailResponse> {
    const { to, sessionDetails } = dto;
    const subject = 'Tennis Session Confirmation';
    const html = `
      <h1>Your Tennis Session is Confirmed!</h1>
      <p>Here are your session details:</p>
      <ul>
        <li>Date: ${sessionDetails.date}</li>
        <li>Time: ${sessionDetails.time}</li>
        <li>Location: ${sessionDetails.location}</li>
      </ul>
      <p>Please arrive 10 minutes before your session.</p>
      <p>If you need to cancel, please do so at least 24 hours in advance.</p>
      <p>Best regards,<br>NYU Tennis Club Team</p>
    `;

    return this.sendMail({ to: [to], subject, html });
  }
}
