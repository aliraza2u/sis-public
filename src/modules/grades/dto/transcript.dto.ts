import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranscriptBreakdownItemDto {
  @ApiProperty({ example: 'quiz' })
  type: string;

  @ApiProperty({ example: 'Quiz 1' })
  name: string;

  @ApiProperty({ example: 8 })
  score: number;

  @ApiPropertyOptional({ example: 10 })
  maxScore?: number | null;
}

export class TranscriptFinalDto {
  @ApiPropertyOptional({ example: 85 })
  score?: number | null;

  @ApiPropertyOptional({ example: 'A' })
  grade?: string | null;

  @ApiProperty({ example: 'pass', enum: ['pass', 'fail'] })
  result: string;
}

export class TranscriptCourseDto {
  @ApiProperty({ description: 'Course record ID', example: 'CRS-xxx' })
  courseId: string;

  @ApiProperty({ example: 'Python Bootcamp', description: 'Display title (e.g. English)' })
  course: string;

  @ApiPropertyOptional({
    description: 'Student roll number for this course enrollment (from approved application)',
    nullable: true,
  })
  rollNumber: string | null;

  @ApiPropertyOptional({
    description: 'Batch code for this course enrollment',
    nullable: true,
  })
  batchCode: string | null;

  @ApiPropertyOptional({
    description: 'Localized batch name',
    example: { en: 'Fall 2025', ar: 'خريف 2025' },
    nullable: true,
  })
  batchName: Record<string, string> | null;

  @ApiPropertyOptional({ nullable: true })
  batchStartDate: Date | null;

  @ApiPropertyOptional({ nullable: true })
  batchEndDate: Date | null;

  @ApiProperty({ type: [TranscriptBreakdownItemDto] })
  breakdown: TranscriptBreakdownItemDto[];

  @ApiProperty({ type: TranscriptFinalDto })
  final: TranscriptFinalDto;
}
