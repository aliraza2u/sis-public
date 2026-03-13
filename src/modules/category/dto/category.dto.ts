import { LocalizedStringDto } from '@/common/dto/localized-string.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name (multilingual)',
    example: { en: 'Islamic Studies', ar: 'الدراسات الإسلامية' },
  })
  @IsNotEmpty()
  @IsObject()
  name: LocalizedStringDto;

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
  sortOrder?: number;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
