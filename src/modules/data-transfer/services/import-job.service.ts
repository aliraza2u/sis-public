import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportJob, ImportJobStatus } from '@/infrastructure/prisma/client/client';
import { ImportError } from '../strategies/import-strategy.interface';

export interface CreateImportJobDto {
  tenantId: string;
  userId: string;
  entityType: string;
  sourceFilePath: string;
  totalRows: number;
}

export interface UpdateImportJobDto {
  status?: ImportJobStatus;
  processedRows?: number;
  successCount?: number;
  errorCount?: number;
  progress?: number;
  failedRowsPath?: string;
  errorDetails?: ImportError[];
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class ImportJobService {
  private readonly logger = new Logger(ImportJobService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new import job
   */
  async create(dto: CreateImportJobDto): Promise<ImportJob> {
    const job = await this.prisma.importJob.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        entityType: dto.entityType,
        sourceFilePath: dto.sourceFilePath,
        totalRows: dto.totalRows,
        status: 'pending',
      },
    });

    this.logger.log(`Created import job ${job.id} for ${dto.entityType}`);
    return job;
  }

  /**
   * Find a job by ID
   */
  async findById(id: string): Promise<ImportJob | null> {
    return this.prisma.importJob.findUnique({
      where: { id },
    });
  }

  /**
   * Find a job by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<ImportJob> {
    const job = await this.findById(id);
    if (!job) {
      throw new NotFoundException(`Import job ${id} not found`);
    }
    return job;
  }

  /**
   * List jobs for a user with pagination
   */
  async findByUser(
    userId: string,
    options?: { skip?: number; take?: number },
  ): Promise<{ jobs: ImportJob[]; total: number }> {
    const [jobs, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip || 0,
        take: options?.take || 20,
      }),
      this.prisma.importJob.count({
        where: { userId },
      }),
    ]);

    return { jobs, total };
  }

  /**
   * Update a job
   */
  async update(id: string, dto: UpdateImportJobDto): Promise<ImportJob> {
    const updateData: Record<string, unknown> = {};

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.processedRows !== undefined) updateData.processedRows = dto.processedRows;
    if (dto.successCount !== undefined) updateData.successCount = dto.successCount;
    if (dto.errorCount !== undefined) updateData.errorCount = dto.errorCount;
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.failedRowsPath !== undefined) updateData.failedRowsPath = dto.failedRowsPath;
    if (dto.errorDetails !== undefined) updateData.errorDetails = dto.errorDetails;
    if (dto.startedAt !== undefined) updateData.startedAt = dto.startedAt;
    if (dto.completedAt !== undefined) updateData.completedAt = dto.completedAt;

    return this.prisma.importJob.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Update job progress
   */
  async updateProgress(
    id: string,
    processedRows: number,
    successCount: number,
    errorCount: number,
    totalRows: number,
  ): Promise<void> {
    const progress = totalRows > 0 ? (processedRows / totalRows) * 100 : 0;

    await this.prisma.importJob.update({
      where: { id },
      data: {
        processedRows,
        successCount,
        errorCount,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
      },
    });
  }

  /**
   * Mark job as processing
   */
  async markProcessing(id: string): Promise<void> {
    await this.prisma.importJob.update({
      where: { id },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });
  }

  /**
   * Mark job as completed
   */
  async markCompleted(
    id: string,
    successCount: number,
    errorCount: number,
    failedRowsPath?: string,
    errorDetails?: ImportError[],
  ): Promise<void> {
    const status: ImportJobStatus = errorCount > 0 && successCount === 0 ? 'failed' : 'completed';

    await this.prisma.importJob.update({
      where: { id },
      data: {
        status,
        successCount,
        errorCount,
        progress: 100,
        failedRowsPath,
        errorDetails: errorDetails as unknown as object,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark job as failed
   */
  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.prisma.importJob.update({
      where: { id },
      data: {
        status: 'failed',
        errorDetails: [{ row: 0, field: 'system', message: errorMessage, data: {} }],
        completedAt: new Date(),
      },
    });
  }
}
