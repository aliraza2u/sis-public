import { ApiProperty } from '@nestjs/swagger';
import { TranscriptCourseDto } from './transcript.dto';

export class GenerateTranscriptResponseDto {
  @ApiProperty({ description: 'Transcript record ID' })
  transcriptId: string;

  @ApiProperty({ description: 'Transcript number (e.g. TRN-2025-000001)' })
  transcriptNumber: string;

  @ApiProperty({ description: 'Verification token for public verification link' })
  verificationToken: string;

  @ApiProperty({ description: 'Public URL to verify this transcript' })
  verificationUrl: string;

  @ApiProperty({ description: 'When the transcript was issued' })
  issuedAt: Date;

  @ApiProperty({ description: 'Student name (en/ar)', example: { en: 'Ahmed Al-Saud', ar: 'أحمد السعود' } })
  studentName: { en: string; ar: string };

  @ApiProperty({ description: 'Tenant/institution name', example: { en: 'Al-Makki Institute', ar: 'معهد المكي' } })
  tenantName: Record<string, string> | null;

  @ApiProperty({
    type: [TranscriptCourseDto],
    description: 'Student grades: course list with breakdown (quizzes, assignments) and final (score, grade, result) per course',
  })
  transcript: TranscriptCourseDto[];
}
