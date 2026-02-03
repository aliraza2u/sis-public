import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CourseEntity } from './entities/course.entity';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const tenantId = this.cls.get('tenantId');
    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        tenantId,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: createCourseDto.prerequisites as any,
        learningOutcomes: createCourseDto.learningOutcomes as any,
        syllabus: createCourseDto.syllabus as any,
        requiredDocuments: createCourseDto.requiredDocuments as any,
      },
    });
    return new CourseEntity(course);
  }

  async findAll() {
    const courses = await this.prisma.course.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((course) => new CourseEntity(course));
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!course) {
      throw new I18nNotFoundException('messages.course.notFound');
    }

    return new CourseEntity(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Check if exists
    await this.findOne(id);

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        ...updateCourseDto,
        // Cast JSON fields to any for Prisma compatibility
        prerequisites: updateCourseDto.prerequisites as any,
        learningOutcomes: updateCourseDto.learningOutcomes as any,
        syllabus: updateCourseDto.syllabus as any,
        requiredDocuments: updateCourseDto.requiredDocuments as any,
      },
    });

    return new CourseEntity(updatedCourse);
  }

  async remove(id: string) {
    // Check if exists
    await this.findOne(id);

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
