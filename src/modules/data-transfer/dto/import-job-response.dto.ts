import { ApiProperty } from '@nestjs/swagger';
import { ImportJobStatus } from '@/infrastructure/prisma/client/client';

export class ImportJobResponseDto {
  @ApiProperty({ example: 'IMP-xxxx-xxxx-xxxx' })
  id: string;

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

  @ApiProperty({ required: false })
  startedAt?: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ImportJobListResponseDto {
  @ApiProperty({ type: [ImportJobResponseDto] })
  jobs: ImportJobResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;
}

export class ImportErrorDetailDto {
  @ApiProperty({ example: 5 })
  row: number;

  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: 'Invalid email format' })
  message: string;

  @ApiProperty({ example: { email: 'invalid-email', firstName: 'John' } })
  data: Record<string, unknown>;
}

export class ImportJobErrorsResponseDto {
  @ApiProperty({ type: [ImportErrorDetailDto] })
  errors: ImportErrorDetailDto[];

  @ApiProperty({ example: 5 })
  total: number;
}
