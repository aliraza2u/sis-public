import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryEntity } from './entities/category.entity';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nConflictException } from '@/common/exceptions/i18n.exception';
import { Prisma, type Category as PrismaCategory } from '@/infrastructure/prisma/client/client';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  private toCategoryEntity(category: PrismaCategory): CategoryEntity {
    return new CategoryEntity({
      ...category,
      name: category.name as LocalizedStringDto,
      description: (category.description ?? null) as LocalizedStringDto,
    });
  }

  async create(createCategoryDto: CreateCategoryDto) {
    // Check for duplicate slug within tenant
    // findFirst is automatically scoped to the current tenant by the multi-tenant extension
    const existing = await this.prisma.category.findFirst({
      where: {
        slug: createCategoryDto.slug,
      },
    });

    if (existing) {
      throw new I18nConflictException('messages.category.slugExists');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto as unknown as Prisma.CategoryUncheckedCreateInput,
    });

    return this.toCategoryEntity(category);
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return categories.map((cat) => this.toCategoryEntity(cat));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new I18nNotFoundException('messages.category.notFound');
    }

    return this.toCategoryEntity(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    // Check for slug conflict if slug is being updated
    if (updateCategoryDto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new I18nConflictException('messages.category.slugExists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    return this.toCategoryEntity(updatedCategory);
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
