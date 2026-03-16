import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@/infrastructure/prisma/client/client';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';
import {
  ApplicationListResponseDto,
  ApplicationQueryDto,
  ApplicationSortBy,
} from './dto/application.dto';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyApplications(
    userId: string,
    query?: ApplicationQueryDto,
  ): Promise<ApplicationListResponseDto> {
    return this.findAll({ ...query, applicantId: userId } as any);
  }

  async findAll(
    query?: ApplicationQueryDto & { applicantId?: string },
  ): Promise<ApplicationListResponseDto> {
    const {
      courseId,
      batchId,
      status,
      applicationNumber,
      rollNumber,
      search,
      applicantId,
      page = 1,
      limit = 20,
      sortBy = ApplicationSortBy.CREATED_AT,
      sortOrder = 'desc',
    } = query || {};

    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      ...(courseId && { courseId }),
      ...(batchId && { batchId }),
      ...(status && { status }),
      ...(applicationNumber && {
        applicationNumber: { contains: applicationNumber, mode: 'insensitive' },
      }),
      ...(rollNumber && { rollNumber: { contains: rollNumber, mode: 'insensitive' } }),
      ...(applicantId && { applicantId }),
    };

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        {
          personalInfo: {
            path: ['firstName', 'en'],
            string_contains: search,
          },
        },
        {
          personalInfo: {
            path: ['firstName', 'ar'],
            string_contains: search,
          },
        },
        {
          personalInfo: {
            path: ['lastName', 'en'],
            string_contains: search,
          },
        },
        {
          personalInfo: {
            path: ['lastName', 'ar'],
            string_contains: search,
          },
        },
        {
          applicant: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              {
                firstName: {
                  path: ['en'],
                  string_contains: search,
                },
              },
              {
                firstName: {
                  path: ['ar'],
                  string_contains: search,
                },
              },
              {
                lastName: {
                  path: ['en'],
                  string_contains: search,
                },
              },
              {
                lastName: {
                  path: ['ar'],
                  string_contains: search,
                },
              },
            ],
          },
        },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          applicant: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          batch: {
            include: {
              course: { select: { title: true, code: true } },
              tenant: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications: applications as any,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        batch: { include: { course: true, tenant: true } },
      },
    });
    if (!app) throw new I18nNotFoundException('messages.application.notFound');
    return app;
  }
}
