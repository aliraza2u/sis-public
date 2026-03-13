import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CourseEntity } from './entities/course.entity';
import { CategoryEntity } from '@/modules/category/entities/category.entity';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { FileStorageService } from '@/common/services/file-storage.service';
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
    private readonly fileStorage: FileStorageService,
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

  async create(
    userId: string,
    createCourseDto: CreateCourseDto,
    files?: {
      thumbnailFile?: Express.Multer.File;
      bannerFile?: Express.Multer.File;
      introVideoFile?: Express.Multer.File;
    },
  ) {
    const { introVideoSource, ...dto } = createCourseDto;
    let { introVideoUrl } = dto;
    let thumbnailUrl: string | undefined;
    let bannerUrl: string | undefined;

    // Handle Image Uploads
    if (files?.thumbnailFile) {
      const { fileUrl } = await this.fileStorage.saveFile(
        files.thumbnailFile,
        'courses/thumbnails',
      );
      thumbnailUrl = fileUrl;
    }

    if (files?.bannerFile) {
      const { fileUrl } = await this.fileStorage.saveFile(files.bannerFile, 'courses/banners');
      bannerUrl = fileUrl;
    }

    // Handle Intro Video Logic
    if (introVideoSource === 'upload') {
      if (!files?.introVideoFile) {
        throw new I18nBadRequestException('messages.course.introVideoFileRequired');
      }
      const { fileUrl } = await this.fileStorage.saveFile(files.introVideoFile, 'courses/videos');
      introVideoUrl = fileUrl;
    } else if (introVideoSource === 'link') {
      if (!introVideoUrl) {
        throw new I18nBadRequestException('messages.course.introVideoLinkRequired');
      }
    } else if (introVideoSource) {
      throw new I18nBadRequestException('messages.course.invalidIntroVideoSource');
    }

    const course = await this.prisma.course.create({
      data: {
        ...dto,
        thumbnailUrl,
        bannerUrl,
        introVideoUrl,
        introVideoSource,
        createdBy: userId,
        updatedBy: userId,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: dto.prerequisites as unknown as Prisma.InputJsonValue,
        learningOutcomes: dto.learningOutcomes as unknown as Prisma.InputJsonValue,
        requiredDocuments: dto.requiredDocuments as unknown as Prisma.InputJsonValue,
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

  async update(
    userId: string,
    id: string,
    updateCourseDto: UpdateCourseDto,
    files?: {
      thumbnailFile?: Express.Multer.File;
      bannerFile?: Express.Multer.File;
      introVideoFile?: Express.Multer.File;
    },
  ) {
    // Check if exists
    const existing = await this.findOne(id);

    const { introVideoSource, ...dto } = updateCourseDto;
    let { introVideoUrl } = dto;
    let thumbnailUrl: string | undefined;
    let bannerUrl: string | undefined;

    // Handle Image Uploads
    if (files?.thumbnailFile) {
      const { fileUrl } = await this.fileStorage.saveFile(
        files.thumbnailFile,
        'courses/thumbnails',
      );
      thumbnailUrl = fileUrl;
    }

    if (files?.bannerFile) {
      const { fileUrl } = await this.fileStorage.saveFile(files.bannerFile, 'courses/banners');
      bannerUrl = fileUrl;
    }

    // Handle Intro Video Logic
    if (introVideoSource === 'upload') {
      if (files?.introVideoFile) {
        const { fileUrl } = await this.fileStorage.saveFile(files.introVideoFile, 'courses/videos');
        introVideoUrl = fileUrl;
      } else if (!existing.introVideoUrl || existing.introVideoSource !== 'upload') {
        // If switching to upload but no file provided, that's an error only if there's no existing upload
        throw new I18nBadRequestException('messages.course.introVideoFileRequired');
      }
    } else if (introVideoSource === 'link') {
      if (!introVideoUrl) {
        throw new I18nBadRequestException('messages.course.introVideoLinkRequired');
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        thumbnailUrl,
        bannerUrl,
        introVideoUrl,
        introVideoSource,
        updatedBy: userId,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: dto.prerequisites as unknown as Prisma.InputJsonValue,
        learningOutcomes: dto.learningOutcomes as unknown as Prisma.InputJsonValue,
        requiredDocuments: dto.requiredDocuments as unknown as Prisma.InputJsonValue,
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
