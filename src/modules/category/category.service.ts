import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryEntity } from './entities/category.entity';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nConflictException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const tenantId = this.cls.get('tenantId');

    // Check for duplicate slug within tenant
    const existing = await this.prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: createCategoryDto.slug,
        },
      },
    });

    if (existing) {
      throw new I18nConflictException('messages.category.slugExists');
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        tenantId,
      },
    });

    return new CategoryEntity(category);
  }

  async findAll() {
    const tenantId = this.cls.get('tenantId');
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return categories.map((cat) => new CategoryEntity(cat));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new I18nNotFoundException('messages.category.notFound');
    }

    return new CategoryEntity(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    // Check for slug conflict if slug is being updated
    if (updateCategoryDto.slug) {
      const tenantId = this.cls.get('tenantId');
      const existing = await this.prisma.category.findFirst({
        where: {
          tenantId,
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

    return new CategoryEntity(updatedCategory);
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
