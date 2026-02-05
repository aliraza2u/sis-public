import { ApiProperty } from '@nestjs/swagger';
import { ImportJobStatus, Prisma } from '@/infrastructure/prisma/client/client';

export class ImportJobEntity {
  @ApiProperty({ example: 'IMP-xxxx-xxxx-xxxx' })
  id: string;

  @ApiProperty({ example: 'TNT-xxxx-xxxx-xxxx' })
  tenantId: string;

  @ApiProperty({ example: 'USR-xxxx-xxxx-xxxx' })
  userId: string;

  @ApiProperty({ example: 'user' })
  entityType: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
  status: ImportJobStatus;

  @ApiProperty({ example: 100 })
  totalRows: number;

  @ApiProperty({ example: 50 })
  processedRows: number;

  @ApiProperty({ example: 45 })
  successCount: number;

  @ApiProperty({ example: 5 })
  errorCount: number;

  @ApiProperty({ example: 50.0 })
  progress: number;

  @ApiProperty({ required: false, nullable: true })
  sourceFilePath: string | null;

  @ApiProperty({ required: false, nullable: true })
  failedRowsPath: string | null;

  @ApiProperty({ required: false, nullable: true })
  errorDetails: Prisma.JsonValue;

  @ApiProperty({ required: false, nullable: true })
  startedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  completedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<ImportJobEntity>) {
    Object.assign(this, partial);
  }
}
