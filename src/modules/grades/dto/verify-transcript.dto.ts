import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranscriptCourseDto } from './transcript.dto';

export class VerifyTranscriptResponseDto {
  @ApiProperty({ description: 'Whether the transcript is valid and not revoked' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Transcript record ID' })
  transcriptId: string | null;

  @ApiPropertyOptional({ description: 'Transcript number' })
  transcriptNumber: string | null;

  @ApiPropertyOptional({ description: 'Student name (en/ar)' })
  studentName: { en: string; ar: string } | null;

  @ApiPropertyOptional({ description: 'Tenant/institution name' })
  tenantName: Record<string, string> | null;

  @ApiPropertyOptional({ description: 'When the transcript was issued' })
  issuedAt: Date | null;

  @ApiPropertyOptional({
    type: [TranscriptCourseDto],
    description: 'Student grades: course list with breakdown and final per course (when valid)',
  })
  transcript: TranscriptCourseDto[] | null;

  @ApiPropertyOptional({ description: 'Error message when valid is false' })
  error: string | null;
}
