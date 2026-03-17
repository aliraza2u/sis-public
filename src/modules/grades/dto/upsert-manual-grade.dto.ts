import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class UpsertManualGradeDto {
  @ApiProperty({ description: 'Application (enrollment) ID', example: 'APP-xxx' })
  @IsString()
  applicationId: string;

  @ApiProperty({ enum: ['pass', 'fail'], description: 'Final result' })
  @IsEnum(['pass', 'fail'])
  finalResult: 'pass' | 'fail';

  @ApiPropertyOptional({ description: 'Letter or grade label', example: 'A' })
  @IsOptional()
  @IsString()
  finalGrade?: string;

  @ApiPropertyOptional({ description: 'Numeric score (e.g. 0–100)', example: 85, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalScore?: number;
}
