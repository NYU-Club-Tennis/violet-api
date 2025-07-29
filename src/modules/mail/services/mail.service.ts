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
  private readonly frontendUrl: string = env.url.frontend as string;

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

  async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<IMailResponse> {
    const subject = 'Complete Your NYU Tennis Club Registration';
    const verificationLink = `${this.frontendUrl}/create-profile?resetCode=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #57068c; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">NYU Tennis Club</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Welcome to NYU Tennis Club!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">Thank you for signing up. To complete your registration, please click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="background-color: #57068c; 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Complete Registration
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">This link will expire in 24 hours. If you didn't request this verification, please ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({ to: [email], subject, html });
  }

  async sendBulkAnnouncement(
    emails: string[],
    header: string,
    subject: string,
    body: string,
  ): Promise<IMailResponse> {
    // Create HTML template with the same styling as verification email
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #57068c; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">NYU Tennis Club</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">${header}</h2>
              <div style="color: #666; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${body}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({ to: emails, subject, html });
  }
}
