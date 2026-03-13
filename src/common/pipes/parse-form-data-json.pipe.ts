import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';

/**
 * Pipe to parse stringified JSON fields from multipart/form-data.
 * Multer receives complex objects (like `title: { en: "Course", ar: "دورة" }`) as stringified JSON.
 * This pipe attempts to parse those string fields back into objects before the ValidationPipe runs.
 */
@Injectable()
export class ParseFormDataJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value && typeof value === 'object') {
      const parsedValue = { ...value };

      // Iterate over all keys in the body
      for (const key of Object.keys(parsedValue)) {
        if (typeof parsedValue[key] === 'string') {
          const str = parsedValue[key].trim();
          // Heuristic to detect JSON strings (objects or arrays)
          if (
            (str.startsWith('{') && str.endsWith('}')) ||
            (str.startsWith('[') && str.endsWith(']'))
          ) {
            try {
              parsedValue[key] = JSON.parse(str);
            } catch (error) {
              // If it fails to parse but looked like JSON, we could throw,
              // or just let the ValidationPipe catch the type mismatch later.
              // We'll throw early with a specific error to help frontend devs.
              throw new I18nBadRequestException('upload.invalidJsonFormat', { field: key });
            }
          }
        }
      }

      return parsedValue;
    }

    return value;
  }
}
