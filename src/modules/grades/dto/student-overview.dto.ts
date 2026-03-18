import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentOverviewStudentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ description: 'Localized first name JSON' })
  firstName: Record<string, string>;

  @ApiProperty({ description: 'Localized last name JSON' })
  lastName: Record<string, string>;
}

export class StudentOverviewSummaryDto {
  @ApiProperty({ description: 'Approved enrollments (applications)' })
  totalEnrollments: number;

  @ApiProperty({
    description:
      'Count per progress bucket from StudentCourseGrade; courses without a grade row count as not_started',
  })
  byProgressStatus: {
    not_started: number;
    in_progress: number;
    completed: number;
  };

  @ApiProperty({ description: 'Pass/fail from grade record; pending = no grade yet' })
  byResult: {
    pass: number;
    fail: number;
    pending: number;
  };

  @ApiProperty({ description: 'Courses with a StudentCourseGrade row' })
  coursesWithGradeRecord: number;

  @ApiProperty({
    description: 'Rows in enrollments (approved courses + grade-only courses not in applications)',
  })
  coursesListed: number;
}

export class StudentOverviewEnrollmentDto {
  @ApiPropertyOptional({ description: 'Empty when row is grade-only (no approved application)' })
  applicationId?: string | null;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseCode: string;

  @ApiProperty({ description: 'Course title (localized JSON)' })
  courseTitle: Record<string, string>;

  @ApiPropertyOptional({ description: 'Empty when grade-only' })
  batchId?: string | null;

  @ApiPropertyOptional()
  batchCode: string | null;

  @ApiProperty({ description: 'Batch name (localized JSON)' })
  batchName: Record<string, string>;

  @ApiPropertyOptional()
  batchStartDate: Date | null;

  @ApiPropertyOptional()
  batchEndDate: Date | null;

  @ApiPropertyOptional()
  rollNumber: string | null;

  @ApiPropertyOptional({ enum: ['manual', 'import'] })
  gradeSource: 'manual' | 'import' | null;

  @ApiPropertyOptional({ enum: ['pass', 'fail'] })
  finalResult: 'pass' | 'fail' | null;

  @ApiPropertyOptional()
  finalGrade: string | null;

  @ApiPropertyOptional()
  finalScore: number | null;

  @ApiProperty({
    enum: ['not_started', 'in_progress', 'completed'],
    description: 'From StudentCourseGrade when present; otherwise not_started',
  })
  courseProgressStatus: 'not_started' | 'in_progress' | 'completed';

  @ApiPropertyOptional({ description: 'From StudentCourseGrade (import / manual)' })
  overallProgressPercent: number | null;
}

export class StudentOverviewResponseDto {
  @ApiProperty({ type: StudentOverviewStudentDto })
  student: StudentOverviewStudentDto;

  @ApiProperty({ type: StudentOverviewSummaryDto })
  summary: StudentOverviewSummaryDto;

  @ApiProperty({ type: [StudentOverviewEnrollmentDto] })
  enrollments: StudentOverviewEnrollmentDto[];
}
