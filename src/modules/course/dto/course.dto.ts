import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PrerequisiteDto, LearningOutcomeDto, RequiredDocumentDto } from './course-fields.dto';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

export class CreateCourseDto {
  @ApiProperty({
    description: 'The title of the course (multilingual)',
    example: { en: 'Introduction to Quran', ar: 'مقدمة في القرآن' },
  })
  @IsNotEmpty()
  @IsObject()
  title: LocalizedStringDto;

  @ApiProperty({ description: 'Course Code / Identifier', example: 'QRN101' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'The detailed description (multilingual)',
    required: false,
    example: { en: 'A comprehensive guide to Quranic studies', ar: 'دليل شامل للدراسات القرآنية' },
  })
  @IsOptional()
  @IsObject()
  description?: LocalizedStringDto;

  @ApiProperty({
    description: 'Short description for cards (multilingual)',
    required: false,
    example: { en: 'Learn Quran basics', ar: 'تعلم أساسيات القرآن' },
  })
  @IsOptional()
  @IsObject()
  shortDescription?: LocalizedStringDto;

  @ApiProperty({
    description: 'Thumbnail URL',
    required: false,
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Banner URL',
    required: false,
    example: 'https://example.com/banner.jpg',
  })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({
    description: 'Intro video URL',
    required: false,
    example: 'https://example.com/intro.mp4',
  })
  @IsOptional()
  @IsString()
  introVideoUrl?: string;

  @ApiProperty({ description: 'Category ID', required: false, example: 'CAT-123e4567' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Difficulty Level', required: false, example: 'Beginner' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ description: 'Duration in weeks', required: false, example: 12 })
  @IsOptional()
  @IsInt()
  durationWeeks?: number;

  @ApiProperty({ description: 'Estimated hours', required: false, example: 40 })
  @IsOptional()
  @IsInt()
  estimatedHours?: number;

  @ApiProperty({ description: 'Passing score (0-100)', required: false, example: 60 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  passingScore?: number;

  @ApiProperty({
    description: 'Enable certificate for this course',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @ApiProperty({
    description: 'Prerequisites - Array of prerequisite requirements',
    required: false,
    type: [PrerequisiteDto],
    example: [
      { en: 'Basic Arabic reading skills', ar: 'مهارات القراءة الأساسية باللغة العربية' },
      { en: 'Minimum age: 10 years', ar: 'الحد الأدنى للعمر: 10 سنوات' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrerequisiteDto)
  prerequisites?: PrerequisiteDto[];

  @ApiProperty({
    description: 'Learning Outcomes - What students will learn',
    required: false,
    type: [LearningOutcomeDto],
    example: [
      { en: 'Master basic Tajweed rules', ar: 'إتقان قواعد التجويد الأساسية' },
      { en: 'Memorize 5 short Surahs', ar: 'حفظ 5 سور قصيرة' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningOutcomeDto)
  learningOutcomes?: LearningOutcomeDto[];

  @ApiProperty({
    description: 'Required documents for admission',
    required: false,
    type: [RequiredDocumentDto],
    example: [
      {
        name: { en: 'Birth Certificate', ar: 'شهادة الميلاد' },
        description: { en: 'Official copy required', ar: 'نسخة رسمية مطلوبة' },
        required: true,
      },
      {
        name: { en: 'Recent Photo', ar: 'صورة حديثة' },
        description: { en: 'Passport size', ar: 'بحجم صورة جواز السفر' },
        required: false,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredDocumentDto)
  requiredDocuments?: RequiredDocumentDto[];

  @ApiProperty({ description: 'Is the course published?', required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ description: 'Is the course featured?', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ description: 'Is the course active?', required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Sort order', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
