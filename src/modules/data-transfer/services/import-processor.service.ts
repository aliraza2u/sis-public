import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { t_ } from '@/common/helpers/i18n.helper';
import { QueueService } from '@/modules/queue/queue.service';
import { ImportJobService } from './import-job.service';

import { CsvParserService } from './csv-parser.service';
import { FileStorageService } from './file-storage.service';
import { ImportStrategy, ImportError, ValidatedRow } from '../strategies/import-strategy.interface';
import {
  RAW_IMPORT_STRATEGIES,
  RawImportStrategy,
} from '../strategies/raw-import-strategy.interface';
import { DataTransferConstants } from '@/common/constants/data-transfer.constants';

interface ImportJobPayload {
  jobId: string;
  tenantId: string;
  entityType: string;
  filePath: string;
}

@Injectable()
export class ImportProcessorService implements OnModuleInit {
  private readonly logger = new Logger(ImportProcessorService.name);
  private strategyMap: Map<string, ImportStrategy> = new Map();
  private readonly batchSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly importJobService: ImportJobService,
    private readonly csvParser: CsvParserService,
    private readonly fileStorage: FileStorageService,
    @Inject(RAW_IMPORT_STRATEGIES)
    private readonly rawStrategies: RawImportStrategy[],
  ) {
    // Initialize config values
    this.batchSize = this.configService.get<number>('dataTransfer.batchSize') || 50;

    // Build strategy map for quick lookup
    // All strategies are now RawImportStrategies
    for (const strategy of rawStrategies) {
      this.strategyMap.set(strategy.getEntityType(), strategy);
    }
  }

  async onModuleInit() {
    // Subscribe to import queue
    await this.queueService.subscribe<ImportJobPayload>(
      DataTransferConstants.IMPORT_QUEUE_NAME,
      async (job) => {
        await this.processJob(job.data);
      },
    );

    this.logger.log('Import processor subscribed to queue');
  }

  /**
   * Process an import job
   */
  async processJob(payload: ImportJobPayload): Promise<void> {
    const { jobId, tenantId, entityType, filePath } = payload;

    this.logger.log(`Processing import job ${jobId} for ${entityType}`);

    try {
      // Mark job as processing
      await this.importJobService.markProcessing(jobId);

      // Get the appropriate strategy
      const strategy = this.strategyMap.get(entityType);
      if (!strategy) {
        throw new Error(`No import strategy found for entity type: ${entityType}`);
      }

      // Read and parse the CSV file
      const fileBuffer = await this.fileStorage.readFile(filePath);
      const { rows, totalRows, headers } = await this.csvParser.parseBuffer(fileBuffer);

      // Validate headers
      const requiredHeaders = strategy.getExpectedHeaders().slice(0, -1); // Exclude optional fields
      const headerValidation = this.csvParser.validateHeaders(headers, requiredHeaders);
      if (!headerValidation.isValid) {
        // Create a header validation error
        const headerError: ImportError = {
          row: 0,
          field: 'file_headers',
          message: t_('dataTransfer.headerValidationFailed', {
            missingHeaders: headerValidation.missingHeaders.join(', '),
            expectedHeaders: requiredHeaders.join(', '),
          }),
          data: { providedHeaders: headers, missingHeaders: headerValidation.missingHeaders },
        };

        // Generate CSV with error information
        const errorCsv = await this.csvParser.generateFailedRowsCsv([headerError], headers);
        const failedRowsPath = await this.fileStorage.saveString(errorCsv, 'csv');

        // Mark job as failed with the error details
        await this.importJobService.markCompleted(jobId, 0, 1, failedRowsPath, [headerError]);

        this.logger.error(`Import job ${jobId} failed due to header validation`);
        return; // Exit early, don't throw
      }

      // Process in batches
      const allErrors: ImportError[] = [];
      let totalSuccess = 0;
      let totalProcessed = 0;

      for (let i = 0; i < rows.length; i += this.batchSize) {
        const batch = rows.slice(i, i + this.batchSize);
        const { successCount, errors } = await this.processBatch(batch, i, strategy, tenantId);

        totalSuccess += successCount;
        totalProcessed += batch.length;
        allErrors.push(...errors);

        // Update progress
        await this.importJobService.updateProgress(
          jobId,
          totalProcessed,
          totalSuccess,
          allErrors.length,
          totalRows,
        );
      }

      // Save failed rows if any
      let failedRowsPath: string | undefined;
      if (allErrors.length > 0) {
        const failedCsv = await this.csvParser.generateFailedRowsCsv(allErrors, headers);
        failedRowsPath = await this.fileStorage.saveString(failedCsv, 'csv');
      }

      // Mark job as completed
      await this.importJobService.markCompleted(
        jobId,
        totalSuccess,
        allErrors.length,
        failedRowsPath,
        allErrors,
      );

      this.logger.log(
        `Import job ${jobId} completed: ${totalSuccess} success, ${allErrors.length} errors`,
      );
    } catch (error) {
      this.logger.error(`Import job ${jobId} failed:`, error);
      await this.importJobService.markFailed(
        jobId,
        t_('dataTransfer.importFailed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    }
  }

  /**
   * Process a batch of rows
   */
  private async processBatch(
    rows: Record<string, unknown>[],
    startIndex: number,
    strategy: ImportStrategy,
    tenantId: string,
  ): Promise<{ successCount: number; errors: ImportError[] }> {
    const validatedRows: ValidatedRow[] = [];
    const validationErrors: ImportError[] = [];
    const existingKeys = new Set<string>();

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const rowIndex = startIndex + i + 2; // +2 for header row and 1-based index
      const result = await strategy.validate(rows[i], rowIndex, existingKeys);

      if (result.isValid && result.normalizedData) {
        validatedRows.push({ rowIndex, data: result.normalizedData });
        // Track key for duplicate detection (email for users, slug for tenants)
        const key = String(
          result.normalizedData.email || result.normalizedData.slug || '',
        ).toLowerCase();
        if (key) existingKeys.add(key);
      } else {
        for (const error of result.errors) {
          validationErrors.push({
            row: rowIndex,
            field: error.field,
            message: error.message,
            data: rows[i],
          });
        }
      }
    }

    // Import valid rows
    let importedCount = 0;
    const importErrors: ImportError[] = [];

    if (validatedRows.length > 0) {
      const result = await strategy.importBatch(validatedRows, tenantId);
      importedCount = result.successCount;
      importErrors.push(...result.errors);
    }

    return {
      successCount: importedCount,
      errors: [...validationErrors, ...importErrors],
    };
  }

  /**
   * Enqueue an import job
   */
  async enqueueJob(payload: ImportJobPayload): Promise<void> {
    await this.queueService.enqueue(DataTransferConstants.IMPORT_QUEUE_NAME, payload);
    this.logger.debug(`Enqueued import job ${payload.jobId}`);
  }
}
