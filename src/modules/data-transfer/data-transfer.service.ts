import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportJobService } from './services/import-job.service';
import { ImportProcessorService } from './services/import-processor.service';
import { CsvParserService } from './services/csv-parser.service';
import { FileStorageService } from './services/file-storage.service';
import { ExportService } from './services/export.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { ExportEntityType } from '@/common/enums/export-entity-type.enum';
import { ImportJob } from '@/infrastructure/prisma/client/client';

@Injectable()
export class DataTransferService {
  private readonly logger = new Logger(DataTransferService.name);
  private readonly maxFileSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly importJobService: ImportJobService,
    private readonly importProcessor: ImportProcessorService,
    private readonly csvParser: CsvParserService,
    private readonly fileStorage: FileStorageService,
    private readonly exportService: ExportService,
  ) {
    this.maxFileSize =
      this.configService.get<number>('dataTransfer.maxFileSize') || 10 * 1024 * 1024;
  }

  /**
   * Initiate an import from an uploaded CSV file
   */
  async initiateImport(
    file: Express.Multer.File,
    entityType: ImportEntityType,
    userId: string,
    tenantId: string,
  ): Promise<ImportJob> {
    // Validate file
    this.validateFile(file);

    // Parse CSV to get row count
    const { totalRows } = await this.csvParser.parseBuffer(file.buffer);

    if (totalRows === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    // Save file to temp storage
    const filePath = await this.fileStorage.saveFile(file.buffer, 'csv');

    // Create import job
    const job = await this.importJobService.create({
      tenantId,
      userId,
      entityType,
      sourceFilePath: filePath,
      totalRows,
    });

    // Enqueue for background processing
    await this.importProcessor.enqueueJob({
      jobId: job.id,
      tenantId,
      entityType,
      filePath,
    });

    this.logger.log(`Import job ${job.id} created for ${entityType} with ${totalRows} rows`);

    return job;
  }

  /**
   * Get import job status
   */
  async getJobStatus(jobId: string, userId: string): Promise<ImportJob> {
    const job = await this.importJobService.findByIdOrThrow(jobId);

    // Ensure user owns the job
    if (job.userId !== userId) {
      throw new ForbiddenException('You do not have access to this import job');
    }

    return job;
  }

  /**
   * List import jobs for a user
   */
  async listJobs(
    userId: string,
    options?: { skip?: number; take?: number },
  ): Promise<{ jobs: ImportJob[]; total: number }> {
    return this.importJobService.findByUser(userId, options);
  }

  /**
   * Get error details for a job
   */
  async getJobErrors(jobId: string, userId: string): Promise<{ errors: unknown[]; total: number }> {
    const job = await this.getJobStatus(jobId, userId);

    const errors = Array.isArray(job.errorDetails) ? job.errorDetails : [];
    return {
      errors,
      total: errors.length,
    };
  }

  /**
   * Get failed rows CSV for download
   */
  async getFailedRowsCsv(jobId: string, userId: string): Promise<Buffer | null> {
    const job = await this.getJobStatus(jobId, userId);

    if (!job.failedRowsPath) {
      return null;
    }

    const exists = await this.fileStorage.fileExists(job.failedRowsPath);
    if (!exists) {
      throw new NotFoundException('Failed rows file not found');
    }

    return this.fileStorage.readFile(job.failedRowsPath);
  }

  /**
   * Export data to CSV
   */
  async exportToCsv(
    entityType: ExportEntityType,
    tenantId: string,
  ): Promise<{ content: string; filename: string }> {
    const content = await this.exportService.export(entityType, tenantId);
    const filename = this.exportService.getExportFilename(entityType);

    return { content, filename };
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check file type
    const validMimeTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only CSV files are allowed');
    }

    // Check file extension
    const filename = file.originalname.toLowerCase();
    if (!filename.endsWith('.csv')) {
      throw new BadRequestException('Invalid file extension. Only .csv files are allowed');
    }
  }
}
