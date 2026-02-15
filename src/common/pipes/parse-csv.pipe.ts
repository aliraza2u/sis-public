import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  HttpStatus,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class ParseCsvPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    const maxFileSize = this.configService.getOrThrow<number>('dataTransfer.maxFileSize');

    // Use ParseFilePipeBuilder for standard validation
    const pipe = new ParseFilePipeBuilder()
      .addFileTypeValidator({
        fileType: /(csv|text\/plain|application\/vnd.ms-excel)/,
      })
      .addMaxSizeValidator({
        maxSize: maxFileSize,
      })
      .build({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: (errors) => {
          // Determine if it's a size or type error to give specific message
          const isSizeError = errors.includes('size');
          if (isSizeError) {
            return new I18nBadRequestException('dataTransfer.fileTooLarge', {
              maxSize: maxFileSize / (1024 * 1024),
            });
          }
          return new I18nBadRequestException('dataTransfer.invalidFile');
        },
      });

    return pipe.transform(value);
  }
}
