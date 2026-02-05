import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { FileStorageService } from './services/file-storage.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly tempFileMaxAge: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileStorage: FileStorageService,
  ) {
    this.tempFileMaxAge =
      this.configService.get<number>('dataTransfer.tempFileMaxAge') || 24 * 60 * 60 * 1000;
  }

  /**
   * Cleanup old temp files daily at 3 AM
   * Retention period can be configured via DATA_TRANSFER_TEMP_FILE_MAX_AGE env variable
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('Starting scheduled cleanup of temp files...');

    try {
      const deletedCount = await this.fileStorage.cleanupOldFiles(this.tempFileMaxAge);

      this.logger.log(`Scheduled cleanup completed: ${deletedCount} files deleted`);
    } catch (error) {
      this.logger.error('Scheduled cleanup failed:', error);
    }
  }
}
