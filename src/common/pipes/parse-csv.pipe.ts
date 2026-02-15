import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  HttpStatus,
  ParseFilePipeBuilder,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class ParseCsvPipe implements PipeTransform {
  private readonly logger = new Logger(ParseCsvPipe.name);

  constructor(private readonly configService: ConfigService) {}

  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    const maxFileSize = this.configService.getOrThrow<number>('dataTransfer.maxFileSize');

    if (value) {
      this.logger.debug(
        `Validating file: ${value.originalname}, Mime: ${value.mimetype}, Size: ${value.size}`,
      );

      // Manual Validation for better control and debugging

      // 1. Size Validation
      if (value.size > maxFileSize) {
        throw new I18nBadRequestException('__i18n:dataTransfer.fileTooLarge', {
          maxSize: maxFileSize / (1024 * 1024),
        });
      }

      // 2. Type Validation
      // Allow common CSV mime types and generic streams
      const allowedMimeTypes = [
        'text/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/octet-stream',
        'application/csv',
        'text/x-csv',
      ];

      if (!allowedMimeTypes.includes(value.mimetype)) {
        this.logger.warn(`Invalid mime type blocked: ${value.mimetype}`);
        throw new I18nBadRequestException('__i18n:dataTransfer.invalidFile');
      }
    }

    return value;
  }
}
