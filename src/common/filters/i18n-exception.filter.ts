import { Catch, ExceptionFilter, ArgumentsHost, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { I18nException } from '../exceptions/i18n.exception';

/**
 * Global exception filter that intercepts I18nException instances
 * and translates the message before sending the response.
 */
@Catch(I18nException)
@Injectable()
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: I18nException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Translate the message using the stored translation key
    const message = await this.i18n.translate(exception.translationKey, {
      args: exception.translationArgs || {},
    });

    // Send the translated response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
