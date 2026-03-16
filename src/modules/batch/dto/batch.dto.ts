import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';
import { BatchEntity } from '../entities/batch.entity';

export enum BatchSortBy {
  NAME = 'name',
  CODE = 'code',
  BATCH_NUMBER = 'batchNumber',
  START_DATE = 'startDate',
  ENROLLMENT_END_DATE = 'enrollmentEndDate',
  CREATED_AT = 'createdAt',
  IS_ACTIVE = 'isActive',
}

export class CreateBatchDto {
  @ApiProperty({ description: 'Batch Name (multilingual)', example: { en: 'Fall 2025' } })
  @IsNotEmpty()
  @IsObject()
  name: LocalizedStringDto;

  @ApiProperty({ description: 'Batch Internal Code', required: false, example: 'WEB-2025' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Batch Number', example: '01' })
  @IsNotEmpty()
  @IsString()
  batchNumber: string;

  @ApiProperty({ description: 'Enrollment Open Date', example: '2026-01-01T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  enrollmentStartDate: string;

  @ApiProperty({ description: 'Enrollment Close Date', example: '2026-03-01T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  enrollmentEndDate: string;

  @ApiProperty({ description: 'Classes Start Date', example: '2026-03-15T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Classes End Date',
    required: false,
    example: '2026-06-15T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Maximum students allowed', example: 50 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxStudents: number;

  @ApiProperty({ description: 'Is batch active?', required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {}

export class BatchQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Search term for name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by enrollment status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  enrollmentOpen?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: BatchSortBy,
    default: BatchSortBy.START_DATE,
  })
  @IsOptional()
  @IsEnum(BatchSortBy)
  sortBy?: BatchSortBy = BatchSortBy.START_DATE;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BatchListResponseDto {
  @ApiProperty({ type: [BatchEntity] })
  batches: BatchEntity[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
