import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CourseEntity } from './entities/course.entity';
import { CategoryEntity } from '@/modules/category/entities/category.entity';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';
import type {
  Category as PrismaCategory,
  Course as PrismaCourse,
  Prisma,
} from '@/infrastructure/prisma/client/client';
import type { LocalizedStringDto } from '@/common/dto/localized-string.dto';
import type {
  LearningOutcomeDto,
  PrerequisiteDto,
  RequiredDocumentDto,
} from './dto/course-fields.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  private asLocalized(value: unknown): LocalizedStringDto {
    return value as LocalizedStringDto;
  }

  private asNullableLocalized(value: unknown): LocalizedStringDto | null {
    return (value ?? null) as LocalizedStringDto | null;
  }

  private asNullableArray<T>(value: unknown): T[] | null {
    return (value ?? null) as T[] | null;
  }

  private toCourseEntity(
    course: PrismaCourse & { category?: PrismaCategory | null },
  ): CourseEntity {
    return new CourseEntity({
      ...course,
      category: course.category
        ? new CategoryEntity({
            ...course.category,
            name: this.asLocalized(course.category.name),
            description: this.asNullableLocalized(course.category.description),
          })
        : null,
      title: this.asLocalized(course.title),
      description: this.asNullableLocalized(course.description),
      shortDescription: this.asNullableLocalized(course.shortDescription),
      prerequisites: this.asNullableArray<PrerequisiteDto>(course.prerequisites),
      learningOutcomes: this.asNullableArray<LearningOutcomeDto>(course.learningOutcomes),
      requiredDocuments: this.asNullableArray<RequiredDocumentDto>(course.requiredDocuments),
      passingScore: course.passingScore ? Number(course.passingScore) : null,
    });
  }

  async create(userId: string, createCourseDto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        createdBy: userId,
        updatedBy: userId,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: createCourseDto.prerequisites as unknown as Prisma.InputJsonValue,
        learningOutcomes: createCourseDto.learningOutcomes as unknown as Prisma.InputJsonValue,
        requiredDocuments: createCourseDto.requiredDocuments as unknown as Prisma.InputJsonValue,
      } as unknown as Prisma.CourseUncheckedCreateInput,
    });
    return this.toCourseEntity(course);
  }

  async findAll() {
    const courses = await this.prisma.course.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((course) => this.toCourseEntity(course));
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id },
      include: { category: true },
    });

    if (!course) {
      throw new I18nNotFoundException('messages.course.notFound');
    }

    return this.toCourseEntity(course);
  }

  async update(userId: string, id: string, updateCourseDto: UpdateCourseDto) {
    // Check if exists
    await this.findOne(id);

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        ...updateCourseDto,
        updatedBy: userId,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: updateCourseDto.prerequisites as unknown as Prisma.InputJsonValue,
        learningOutcomes: updateCourseDto.learningOutcomes as unknown as Prisma.InputJsonValue,
        requiredDocuments: updateCourseDto.requiredDocuments as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toCourseEntity(updatedCourse);
  }

  async remove(id: string) {
    // Check if exists
    await this.findOne(id);

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
