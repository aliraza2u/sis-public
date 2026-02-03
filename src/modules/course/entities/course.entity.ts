import { BaseSoftDeleteEntity } from '@/common/entities/base.entity';
import { Course, Tenant, User } from '@/infrastructure/prisma/client/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CourseEntity extends BaseSoftDeleteEntity implements Course {
  constructor(partial: Partial<CourseEntity>) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: 'The unique identifier of the course',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The tenant ID this course belongs to', example: 'tenant-123' })
  @Expose()
  tenantId: string;

  @ApiProperty({
    description: 'The title of the course (multilingual)',
    example: { en: 'Introduction to Programming' },
  })
  @Expose()
  title: any;

  @ApiProperty({
    description: 'The detailed description of the course (multilingual)',
    example: { en: 'A comprehensive guide...' },
  })
  @Expose()
  description: any;

  @ApiProperty({
    description: 'Short description for cards (multilingual)',
    example: { en: 'Learn basics...' },
  })
  @Expose()
  shortDescription: any;

  @ApiProperty({
    description: 'URL of the course thumbnail',
    required: false,
    example: 'https://example.com/image.jpg',
  })
  @ApiProperty({ description: 'Thumbnail URL', required: false })
  @Expose()
  thumbnailUrl: string | null;

  @ApiProperty({ description: 'Category ID', required: false })
  @Expose()
  categoryId: string | null;

  @ApiProperty({ description: 'Category details', required: false })
  @Expose()
  category: any;

  @ApiProperty({ description: 'Difficulty level', required: false, example: 'Beginner' })
  @Expose()
  level: string | null;

  @ApiProperty({ description: 'Duration in weeks', required: false, example: 12 })
  @Expose()
  durationWeeks: number | null;

  @ApiProperty({ description: 'Prerequisites for the course (multilingual)', required: false })
  @Expose()
  prerequisites: any;

  @ApiProperty({ description: 'Learning outcomes (multilingual)', required: false })
  @Expose()
  learningOutcomes: any;

  @ApiProperty({ description: 'Syllabus structure (multilingual)', required: false })
  @Expose()
  syllabus: any;

  @ApiProperty({ description: 'Course Code / Identifier', required: false, example: 'CS101' })
  @Expose()
  code: string | null;

  @ApiProperty({ description: 'Required documents for admission', required: false })
  @Expose()
  requiredDocuments: any;

  @ApiProperty({ description: 'Is the course published?', example: true })
  @Expose()
  isPublished: boolean;

  @ApiProperty({ description: 'Is the course featured?', example: false })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({ description: 'Is the course active?', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display', example: 1 })
  @Expose()
  sortOrder: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  declare createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  declare updatedAt: Date;

  @ApiProperty({ description: 'User ID who created the course', required: false })
  @Expose()
  declare createdBy: string | null;

  @ApiProperty({ description: 'User ID who last updated the course', required: false })
  @Expose()
  declare updatedBy: string | null;

  @Expose()
  declare deletedAt: Date | null;

  @Expose()
  declare deletedBy: string | null;

  @Exclude()
  creator?: User;

  @Exclude()
  tenant?: Tenant;
}
