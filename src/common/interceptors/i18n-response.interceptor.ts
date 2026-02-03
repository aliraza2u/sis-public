import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

/**
 * Interceptor that automatically translates i18n markers in response messages.
 * Looks for strings starting with '__i18n:' and translates them before sending response.
 */
@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (data) => {
        if (data && typeof data === 'object') {
          return this.translateObject(data);
        }
        return data;
      }),
      // Convert Promise back to Observable
      map((promise) => promise),
    );
  }

  private async translateObject(obj: any): Promise<any> {
    // Handle message field
    if (typeof obj.message === 'string' && obj.message.startsWith('__i18n:')) {
      const key = obj.message.substring(7); // Remove '__i18n:' prefix
      obj.message = await this.i18n.translate(key);
    }

    // Recursively handle nested objects (if needed in future)
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = await this.translateObject(obj[key]);
      }
    }

    return obj;
  }
}
