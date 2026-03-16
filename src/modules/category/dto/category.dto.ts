import { LocalizedStringDto } from '@/common/dto/localized-string.dto';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CategoryEntity } from '../entities/category.entity';

export enum CategorySortBy {
  NAME = 'name',
  SLUG = 'slug',
  IS_ACTIVE = 'isActive',
  SORT_ORDER = 'sortOrder',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name (multilingual)',
    example: { en: 'Islamic Studies', ar: 'الدراسات الإسلامية' },
  })
  @IsNotEmpty()
  @IsObject()
  name: LocalizedStringDto;

  @ApiPropertyOptional({
    description: 'Category description (multilingual)',
    example: { en: 'Courses related to Islamic studies', ar: 'دورات متعلقة بالدراسات الإسلامية' },
  })
  @IsOptional()
  @IsObject()
  description?: LocalizedStringDto;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'islamic-studies',
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    description: 'Is the category active?',
    required: false,
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    required: false,
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryQueryDto {
  @ApiPropertyOptional({ description: 'Search term for category name (multilingual)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: CategorySortBy,
    default: CategorySortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy = CategorySortBy.CREATED_AT;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CategoryListResponseDto {
  @ApiProperty({ type: [CategoryEntity] })
  categories: CategoryEntity[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
