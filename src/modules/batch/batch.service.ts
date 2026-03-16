import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { ApplicationStatus } from '@/infrastructure/prisma/client/client';

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
    
    // Check if batch code exists
    if (createBatchDto.code) {
      const existingCode = await this.prisma.batch.findFirst({
        where: {
          code: createBatchDto.code,
          deletedAt: null,
        },
      });

      if (existingCode) {
        throw new I18nBadRequestException('messages.batch.codeExists', { code: createBatchDto.code });
      }
    }

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
    const existing = await this.findOne(id);

    // Check if new code already exists
    if (updateBatchDto.code && updateBatchDto.code !== existing.code) {
      const existingCode = await this.prisma.batch.findFirst({
        where: {
          code: updateBatchDto.code,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new I18nBadRequestException('messages.batch.codeExists', { code: updateBatchDto.code });
      }
    }

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

  async findStudentBatch(userId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        applicantId: userId,
        status: ApplicationStatus.approved,
      },
      include: {
        batch: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!application) {
      throw new I18nNotFoundException('messages.batch.noAssignedBatch');
    }

    return application.batch;
  }
}
