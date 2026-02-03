import { BaseSoftDeleteEntity } from '@/common/entities/base.entity';
import { Batch, Course, Tenant, Application } from '@/infrastructure/prisma/client/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CourseEntity } from '@/modules/course/entities/course.entity';

export class BatchEntity extends BaseSoftDeleteEntity implements Batch {
  constructor(partial: Partial<BatchEntity>) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ description: 'Unique identifier', example: 'batch-123' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tenant ID', example: 'tenant-123' })
  @Expose()
  tenantId: string;

  @ApiProperty({ description: 'Course ID', example: 'course-123' })
  @Expose()
  courseId: string;

  @ApiProperty({ description: 'Batch Name (Multilingual)', example: { en: 'Fall 2025' } })
  @Expose()
  name: any;

  @ApiProperty({ description: 'Internal batch code', example: 'WEB-2025-01', required: false })
  @Expose()
  code: string | null;

  @ApiProperty({ description: 'Batch Number', example: '01' })
  @Expose()
  batchNumber: string;

  @ApiProperty({ description: 'Enrollment Start Date' })
  @Expose()
  enrollmentStartDate: Date;

  @ApiProperty({ description: 'Enrollment End Date' })
  @Expose()
  enrollmentEndDate: Date;

  @ApiProperty({ description: 'Batch Start Date' })
  @Expose()
  startDate: Date;

  @ApiProperty({ description: 'Batch End Date', required: false })
  @Expose()
  endDate: Date | null;

  @ApiProperty({ description: 'Maximum allowed students', example: 50 })
  @Expose()
  maxStudents: number;

  @ApiProperty({ description: 'Is active?', example: true })
  @Expose()
  isActive: boolean;

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

  @ApiProperty({ type: () => CourseEntity })
  @Expose()
  @Type(() => CourseEntity)
  course?: CourseEntity;

  @Exclude()
  applications?: Application[];
}
