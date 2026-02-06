import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@/infrastructure/prisma/client/client';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { PRISMA_ERROR_MAPPING } from '@/common/constants/prisma.constants';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Handle Prisma Errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const lang = I18nContext.current()?.lang || 'en';
      const errorCode = exception.code;
      const errorMapping = PRISMA_ERROR_MAPPING[errorCode];

      if (errorMapping) {
        httpStatus = errorMapping.status;
        message = this.i18n.translate(errorMapping.key, {
          lang,
          args: errorMapping.args ? errorMapping.args(exception.meta) : {},
        });
      } else {
        this.logger.error(`Prisma Error: ${errorCode}`, exception);
      }
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest<any>()) as string,
      message:
        typeof message === 'object' && message !== null && 'message' in message
          ? (message as any).message
          : message,
    };

    if (httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(exception);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
