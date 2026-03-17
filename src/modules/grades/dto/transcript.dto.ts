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
  @ApiProperty({ example: 'Python Bootcamp' })
  course: string;

  @ApiProperty({ type: [TranscriptBreakdownItemDto] })
  breakdown: TranscriptBreakdownItemDto[];

  @ApiProperty({ type: TranscriptFinalDto })
  final: TranscriptFinalDto;
}
