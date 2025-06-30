import { Injectable, Logger, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger implements LoggerService {
  private contextName?: string;

  setContext(context: string): this {
    this.contextName = context;
    return this;
  }

  private formatMessage(message: any): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;

    try {
      return JSON.stringify(message);
    } catch (err) {
      return '[Unstringifiable message]';
    }
  }

  log(message: any, context?: string) {
    super.log(this.formatMessage(message), context || this.contextName);
  }

  error(message: any, trace?: string, context?: string) {
    const formatted = this.formatMessage(message);
    const errorTrace =
      trace ?? (message instanceof Error ? message.stack : undefined);
    super.error(formatted, errorTrace, context || this.contextName);
  }

  warn(message: any, context?: string) {
    super.warn(this.formatMessage(message), context || this.contextName);
  }

  debug(message: any, context?: string) {
    super.debug(this.formatMessage(message), context || this.contextName);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatMessage(message), context || this.contextName);
  }
}
