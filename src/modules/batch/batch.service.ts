import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  async create(courseId: string, createBatchDto: CreateBatchDto) {
    const tenantId = this.cls.get('tenantId');
    // Verify course exists (optional if foreign key handles it, but good for 404)
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new I18nNotFoundException('messages.course.notFound');

    return this.prisma.batch.create({
      data: {
        ...createBatchDto,
        courseId,
        tenantId,
      },
    });
  }

  async findAll(courseId: string) {
    return this.prisma.batch.findMany({
      where: { courseId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findAllActive() {
    const now = new Date();
    return this.prisma.batch.findMany({
      where: {
        isActive: true,
        enrollmentStartDate: { lte: now },
        enrollmentEndDate: { gte: now },
      },
      include: {
        course: true,
      },
      orderBy: { enrollmentEndDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!batch) throw new I18nNotFoundException('messages.batch.notFound');
    return batch;
  }

  async update(id: string, updateBatchDto: UpdateBatchDto) {
    await this.findOne(id);
    return this.prisma.batch.update({
      where: { id },
      data: updateBatchDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.batch.delete({
      where: { id },
    });
  }
}
