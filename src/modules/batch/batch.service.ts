import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  CreateBatchDto,
  UpdateBatchDto,
  BatchQueryDto,
  BatchSortBy,
  BatchListResponseDto,
} from './dto/batch.dto';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { ApplicationStatus, Prisma } from '@/infrastructure/prisma/client/client';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  async create(courseId: string, createBatchDto: CreateBatchDto) {
    const tenantId = this.cls.get('tenantId');
    // Verify course exists
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
        throw new I18nBadRequestException('messages.batch.codeExists', {
          code: createBatchDto.code,
        });
      }
    }

    const { name, ...rest } = createBatchDto;

    return this.prisma.batch.create({
      data: {
        ...rest,
        name: name as unknown as Prisma.JsonObject,
        courseId,
        tenantId,
      },
    });
  }

  async findAll(query?: BatchQueryDto): Promise<BatchListResponseDto> {
    const {
      courseId,
      search,
      isActive,
      enrollmentOpen,
      page = 1,
      limit = 20,
      sortBy = BatchSortBy.START_DATE,
      sortOrder = 'desc',
    } = query || {};

    const skip = (page - 1) * limit;

    const where: Prisma.BatchWhereInput = {
      deletedAt: null,
    };

    if (courseId) {
      where.courseId = courseId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (enrollmentOpen) {
      const now = new Date();
      where.isActive = true;
      where.enrollmentStartDate = { lte: now };
      where.enrollmentEndDate = { gte: now };
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
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

    const [batches, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { course: true },
      }),
      this.prisma.batch.count({ where }),
    ]);

    return {
      batches: batches as any,
      total,
      page,
      limit,
    };
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
        throw new I18nBadRequestException('messages.batch.codeExists', {
          code: updateBatchDto.code,
        });
      }
    }

    const { name, ...rest } = updateBatchDto;

    return this.prisma.batch.update({
      where: { id },
      data: {
        ...rest,
        ...(name && { name: name as unknown as Prisma.JsonObject }),
      } as Prisma.BatchUncheckedUpdateInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.batch.delete({
      where: { id },
    });
  }

  async findStudentBatches(userId: string, query?: BatchQueryDto): Promise<BatchListResponseDto> {
    const {
      courseId,
      search,
      isActive,
      page = 1,
      limit = 20,
      sortBy = BatchSortBy.START_DATE,
      sortOrder = 'desc',
    } = query || {};

    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      applicantId: userId,
      status: ApplicationStatus.approved,
      batch: {
        deletedAt: null,
        ...(courseId && { courseId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
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
          ],
        }),
      },
    };

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          batch: {
            include: {
              course: true,
            },
          },
        },
        orderBy: {
          batch: { [sortBy]: sortOrder },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      batches: applications.map((app) => app.batch) as any,
      total,
      page,
      limit,
    };
  }
}
