import { Injectable, PipeTransform, ArgumentMetadata, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { DataTransferConstants } from '../constants/data-transfer.constants';

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

      if (value.size > maxFileSize) {
        throw new I18nBadRequestException('__i18n:dataTransfer.fileTooLarge', {
          maxSize: maxFileSize / DataTransferConstants.BYTES_PER_MB,
        });
      }

      const allowedMimeTypes = DataTransferConstants.VALID_MIME_TYPES;

      if (!allowedMimeTypes.includes(value.mimetype)) {
        this.logger.warn(`Invalid mime type blocked: ${value.mimetype}`);
        throw new I18nBadRequestException('__i18n:dataTransfer.invalidFile');
      }
    }

    return value;
  }
}
