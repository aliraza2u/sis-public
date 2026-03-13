import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';

/**
 * Interceptor to parse stringified JSON and primitive fields from multipart/form-data.
 * Multer receives complex objects and primitives as strings. This interceptor parses
 * those string fields back into proper types *before* the global ValidationPipe runs.
 */
@Injectable()
export class ParseFormDataJsonInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ParseFormDataJsonInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      for (const key of Object.keys(request.body)) {
        if (typeof request.body[key] === 'string') {
          const str = request.body[key].trim();

          if (str === '') continue;

          // Booleans
          if (str.toLowerCase() === 'true') {
            request.body[key] = true;
            continue;
          }
          if (str.toLowerCase() === 'false') {
            request.body[key] = false;
            continue;
          }

          // Numbers (heuristic: purely digits or decimal, excludes typical IDs/UUIDs)
          if (/^-?\d+(\.\d+)?$/.test(str)) {
            const num = Number(str);
            if (!isNaN(num)) {
              request.body[key] = num;
              continue;
            }
          }

          // JSON Objects or Arrays
          if (
            (str.startsWith('{') && str.endsWith('}')) ||
            (str.startsWith('[') && str.endsWith(']'))
          ) {
            try {
              request.body[key] = JSON.parse(str);
            } catch (error) {
              this.logger.error(`Failed to parse JSON for field ${key}: ${str}`);
              throw new I18nBadRequestException('upload.invalidJsonFormat', { field: key });
            }
          }
        }
      }
    }

    return next.handle();
  }
}
