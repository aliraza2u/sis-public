import { BaseSoftDeleteEntity } from '@/common/entities/base.entity';
import { Category, Tenant, Course } from '@/infrastructure/prisma/client/client';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

export class CategoryEntity extends BaseSoftDeleteEntity implements Category {
  constructor(partial: Partial<CategoryEntity> | any) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ description: 'Unique identifier', example: 'CAT-123e4567' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tenant ID', example: 'TNT-123' })
  @Expose()
  tenantId: string;

  @ApiProperty({
    description: 'Category name (multilingual)',
    example: { en: 'Islamic Studies', ar: 'الدراسات الإسلامية' },
  })
  @Expose()
  name: LocalizedStringDto;

  @ApiProperty({ description: 'URL-friendly slug', example: 'islamic-studies' })
  @Expose()
  slug: string;
  @ApiProperty({ description: 'Category description (multilingual)', required: false })
  @Expose()
  description: LocalizedStringDto | null;

  @ApiProperty({ description: 'Is active?', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Sort order', example: 0 })
  @Expose()
  sortOrder: number;

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
  courses?: Course[];
}
