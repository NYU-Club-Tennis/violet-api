import { Attachment } from 'nodemailer';

export interface IMailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}

export interface ISessionDetails {
  date: string;
  time: string;
  location: string;
}

export interface IMailResponse {
  messageId?: string;
  accepted: string[];
  rejected: string[];
  response: string;
}
