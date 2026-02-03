import { BaseSoftDeleteEntity } from '@/common/entities/base.entity';
import {
  Application,
  Batch,
  Course,
  Tenant,
  User,
  ApplicationStatus,
} from '@/infrastructure/prisma/client/client';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ApplicationEntity extends BaseSoftDeleteEntity implements Application {
  constructor(partial: Partial<ApplicationEntity>) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ description: 'Unique identifier', example: 'app-123' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  @Expose()
  tenantId: string;

  @ApiProperty({ description: 'Batch ID' })
  @Expose()
  batchId: string;

  @ApiProperty({ description: 'Course ID' })
  @Expose()
  courseId: string;

  @ApiProperty({ description: 'Applicant User ID' })
  @Expose()
  applicantId: string;

  @ApiProperty({ description: 'Application Number', example: 'APP-0001' })
  @Expose()
  applicationNumber: string;

  @ApiProperty({
    description: 'Generated Roll Number (if approved)',
    required: false,
    example: 'STU-AM-SD-01-001',
  })
  @Expose()
  rollNumber: string | null;

  @ApiProperty({ description: 'Personal Information JSON' })
  @Expose()
  personalInfo: any;

  @ApiProperty({ description: 'Guardian Information JSON', required: false })
  @Expose()
  guardianInfo: any;

  @ApiProperty({ description: 'Education Information JSON', required: false })
  @Expose()
  educationInfo: any;

  @ApiProperty({ description: 'Application Status', enum: ApplicationStatus, example: 'submitted' })
  @Expose()
  status: ApplicationStatus;

  @ApiProperty({ description: 'Submission Timestamp', required: false })
  @Expose()
  submittedAt: Date | null;

  @ApiProperty({ description: 'Reviewer User ID', required: false })
  @Expose()
  reviewedBy: string | null;

  @ApiProperty({ description: 'Review Timestamp', required: false })
  @Expose()
  reviewedAt: Date | null;

  @ApiProperty({ description: 'Review Notes', required: false })
  @Expose()
  reviewNotes: string | null;

  @ApiProperty({ description: 'Rejection Reason JSON', required: false })
  @Expose()
  rejectionReason: any;

  @ApiProperty({ required: false })
  @Expose()
  ipAddress: string | null;

  @ApiProperty({ required: false })
  @Expose()
  userAgent: string | null;

  @ApiProperty()
  @Expose()
  declare createdAt: Date;

  @ApiProperty()
  @Expose()
  declare updatedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  declare createdBy: string | null;

  @ApiProperty({ required: false })
  @Expose()
  declare updatedBy: string | null;

  @Expose()
  declare deletedAt: Date | null;

  @Expose()
  declare deletedBy: string | null;

  @Exclude()
  tenant?: Tenant;

  @Exclude()
  batch?: Batch;

  @Exclude()
  course?: Course;

  @Exclude()
  applicant?: User;

  @Exclude()
  reviewer?: User;
}
