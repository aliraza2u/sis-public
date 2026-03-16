import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CategorySortBy,
} from './dto/category.dto';
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
    const existing = await this.prisma.category.findFirst({
      where: {
        slug: createCategoryDto.slug,
      },
    });

    if (existing) {
      throw new I18nConflictException('messages.category.slugExists');
    }

    const { name, description, slug, isActive, sortOrder } = createCategoryDto;

    const category = await this.prisma.category.create({
      data: {
        name: name as unknown as Prisma.JsonObject,
        description: description as unknown as Prisma.JsonObject,
        slug,
        isActive,
        sortOrder,
      } as Prisma.CategoryUncheckedCreateInput,
    });

    return this.toCategoryEntity(category);
  }

  async findAll(query?: CategoryQueryDto) {
    const {
      search,
      isActive,
      page = 1,
      limit = 20,
      sortBy = CategorySortBy.CREATED_AT,
      sortOrder = 'desc',
    } = query || {};

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        {
          name: {
            path: ['en'],
            string_contains: search,
          },
        },
        {
          name: {
            path: ['ar'],
            string_contains: search,
          },
        },
      ];
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      categories: categories.map((cat) => this.toCategoryEntity(cat)),
      total,
      page,
      limit,
    };
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

    const { name, description, slug, isActive, sortOrder } = updateCategoryDto;

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name as unknown as Prisma.JsonObject }),
        ...(description !== undefined && {
          description: description as unknown as Prisma.JsonObject,
        }),
        ...(slug && { slug }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      } as Prisma.CategoryUncheckedUpdateInput,
    });

    return this.toCategoryEntity(updatedCategory);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true };
  }
}
