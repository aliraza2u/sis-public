import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ description: 'Batch Name (multilingual)', example: { en: 'Fall 2025' } })
  @IsNotEmpty()
  @IsObject()
  name: any; // LocalizedString

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

export class UpdateBatchDto extends CreateBatchDto {}
