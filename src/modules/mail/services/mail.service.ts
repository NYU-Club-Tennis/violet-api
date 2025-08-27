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
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly frontendUrl: string = env.url.frontend as string;

  constructor(
    private readonly logger: AppLogger,
    private readonly userService: UserService,
  ) {
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

  /**
   * Filter emails based on user preferences
   * @param emails List of email addresses to filter
   * @param notificationType Type of notification ('session' or 'club')
   * @returns Filtered list of emails that have enabled the specific notification type
   */
  private async filterEmailsByPreferences(
    emails: string[],
    notificationType: 'session' | 'club',
  ): Promise<string[]> {
    try {
      if (emails.length === 0) return [];

      // Get users with their email preferences
      const users = await this.userService.findByEmails(emails);

      const filteredEmails = users
        .filter((user) => {
          if (notificationType === 'session') {
            return user.emailSessionNotifications;
          } else {
            return user.emailClubAnnouncements;
          }
        })
        .map((user) => user.email);

      this.logger.log(
        `Filtered ${emails.length} emails to ${filteredEmails.length} based on ${notificationType} preferences`,
      );

      return filteredEmails;
    } catch (error) {
      this.logger.error(
        `Error filtering emails by preferences: ${error.message}`,
      );
      // If filtering fails, return original list to avoid blocking email sending
      return emails;
    }
  }

  /**
   * Send email with preference filtering
   * @param options Mail options
   * @param notificationType Type of notification for preference filtering
   * @returns Mail response
   */
  async sendMailWithPreferences(
    options: SendMailDto,
    notificationType: 'session' | 'club',
  ): Promise<IMailResponse> {
    try {
      // Filter emails based on user preferences
      const filteredEmails = await this.filterEmailsByPreferences(
        options.to,
        notificationType,
      );

      if (filteredEmails.length === 0) {
        this.logger.log(
          `No recipients found after filtering for ${notificationType} notifications`,
        );
        return {
          messageId: undefined,
          accepted: [],
          rejected: [],
          response: 'No recipients found after preference filtering',
        };
      }

      // Send email to filtered recipients
      const mailOptions: IMailOptions = {
        from: env.mail.from ?? 'noreply@nyutennis.com',
        ...options,
        to: filteredEmails,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent with preferences: ${info.messageId} to ${filteredEmails.length} recipients`,
      );

      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };
    } catch (error) {
      this.logger.error('Failed to send email with preferences', error);
      throw error;
    }
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

  async sendForgotPasswordEmail(
    email: string,
    token: string,
  ): Promise<IMailResponse> {
    const subject = 'Reset Your NYU Tennis Club Password';
    const verificationLink = `${this.frontendUrl}/reset-password?resetCode=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #57068c; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">NYU Tennis Club</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">You requested a password reset</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">Please click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="background-color: #57068c; 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({ to: [email], subject, html });
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

    // Use preference filtering for club announcements
    return this.sendMailWithPreferences({ to: emails, subject, html }, 'club');
  }

  /**
   * Send session-related notifications with preference filtering
   * @param emails List of recipient emails
   * @param subject Email subject
   * @param body Email body content
   * @returns Mail response
   */
  async sendSessionNotification(
    emails: string[],
    subject: string,
    body: string,
  ): Promise<IMailResponse> {
    // Create HTML template for session notifications
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #57068c; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">NYU Tennis Club</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Session Update</h2>
              <div style="color: #666; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${body}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use preference filtering for session notifications
    return this.sendMailWithPreferences(
      { to: emails, subject, html },
      'session',
    );
  }

  async sendWaitlistNotification(
    type: 'added' | 'promoted',
    to: string,
    session: { name: string; date: string; time: string; location: string },
    extras?: { position?: number },
  ): Promise<IMailResponse> {
    const { name, date, time, location } = session;

    let subject = '';
    let header = '';
    let body = '';

    if (type === 'added') {
      subject = `You're on the waitlist: ${name}`;
      header = 'You have been added to the waitlist';
      body = `You are now on the waitlist for "${name}".\n\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}\nLocation: ${location}`;
      if (extras?.position) {
        body += `\nYour position: ${extras.position}`;
      }
      body += `\n\nYou'll be notified if a spot opens up.`;
    } else if (type === 'promoted') {
      subject = `You got a spot: ${name}`;
      header = 'Great news! You have been registered';
      body = `A spot opened up and you are now registered for "${name}".\n\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}\nLocation: ${location}\n\nIf you can no longer attend, please cancel to free the spot for others.`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background-color:#57068c;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="color:white;margin:0;">NYU Tennis Club</h1>
            </div>
            <div style="background-color:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color:#333;margin-top:0;">${header}</h2>
              <div style="color:#666;font-size:16px;line-height:1.5;white-space:pre-wrap;">${body}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMailWithPreferences({ to: [to], subject, html }, 'session');
  }
}
