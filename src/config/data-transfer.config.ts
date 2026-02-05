import { registerAs } from '@nestjs/config';

export default registerAs('dataTransfer', () => ({
  // File upload limits - may differ between dev/staging/prod
  maxFileSize: parseInt(process.env.DATA_TRANSFER_MAX_FILE_SIZE || '10485760', 10), // 10MB default

  // Processing configuration - tune based on server resources
  batchSize: parseInt(process.env.DATA_TRANSFER_BATCH_SIZE || '50', 10),

  // Cleanup configuration - adjust retention based on compliance needs
  tempFileMaxAge: parseInt(process.env.DATA_TRANSFER_TEMP_FILE_MAX_AGE || '86400000', 10), // 24 hours default (in ms)
  cleanupCron: process.env.DATA_TRANSFER_CLEANUP_CRON || '0 3 * * *', // 3 AM daily by default
}));
