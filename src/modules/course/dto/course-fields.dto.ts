import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

/**
 * Prerequisites - Array of prerequisite requirements
 * Example: "Basic Arabic reading", "Minimum age 10"
 */
export class PrerequisiteDto {
  @ApiProperty({
    description: 'Prerequisite text (English)',
    example: 'Basic Arabic reading skills',
  })
  @IsNotEmpty()
  @IsString()
  en: string;

  @ApiProperty({
    description: 'Prerequisite text (Arabic)',
    example: 'مهارات القراءة الأساسية باللغة العربية',
    required: false,
  })
  @IsOptional()
  @IsString()
  ar?: string;
}

/**
 * Learning Outcomes - Array of what students will learn
 * Example: "Master Tajweed rules", "Memorize 5 Surahs"
 */
export class LearningOutcomeDto {
  @ApiProperty({
    description: 'Learning outcome (English)',
    example: 'Master basic Tajweed rules',
  })
  @IsNotEmpty()
  @IsString()
  en: string;

  @ApiProperty({
    description: 'Learning outcome (Arabic)',
    example: 'إتقان قواعد التجويد الأساسية',
    required: false,
  })
  @IsOptional()
  @IsString()
  ar?: string;
}

/**
 * Syllabus Module - Single module in course syllabus
 */
export class SyllabusModuleDto {
  @ApiProperty({
    description: 'Module title (localized)',
    type: LocalizedStringDto,
    example: { en: 'Introduction to Tajweed', ar: 'مقدمة في التجويد' },
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @ApiProperty({
    description: 'Module description (localized)',
    type: LocalizedStringDto,
    required: false,
    example: { en: 'Learn basic concepts', ar: 'تعلم المفاهيم الأساسية' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiProperty({
    description: 'Module order/sequence',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  order: number;

  @ApiProperty({
    description: 'List of topics in this module (localized)',
    type: [LocalizedStringDto],
    required: false,
    example: [
      { en: 'Arabic letters', ar: 'الحروف العربية' },
      { en: 'Pronunciation basics', ar: 'أساسيات النطق' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedStringDto)
  topics?: LocalizedStringDto[];
}

/**
 * Syllabus - Complete course syllabus structure
 */
export class SyllabusDto {
  @ApiProperty({
    description: 'Array of course modules',
    type: [SyllabusModuleDto],
    example: [
      {
        title: { en: 'Introduction to Tajweed', ar: 'مقدمة في التجويد' },
        description: { en: 'Learn basic concepts', ar: 'تعلم المفاهيم الأساسية' },
        order: 1,
        topics: [
          { en: 'Arabic letters', ar: 'الحروف العربية' },
          { en: 'Pronunciation basics', ar: 'أساسيات النطق' },
        ],
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyllabusModuleDto)
  modules: SyllabusModuleDto[];
}

/**
 * Required Document - Document needed for application
 */
export class RequiredDocumentDto {
  @ApiProperty({
    description: 'Document name (localized)',
    type: LocalizedStringDto,
    example: { en: 'Birth Certificate', ar: 'شهادة الميلاد' },
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({
    description: 'Document description/instructions (localized)',
    type: LocalizedStringDto,
    required: false,
    example: { en: 'Official copy required', ar: 'نسخة رسمية مطلوبة' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiProperty({
    description: 'Is this document mandatory?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
