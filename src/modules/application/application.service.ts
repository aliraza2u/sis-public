import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@/infrastructure/prisma/client/client';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: {
        applicantId: userId,
      },
      include: {
        batch: {
          include: {
            course: { select: { title: true, code: true } },
            tenant: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });
  }

  async findAll(batchId?: string) {
    return this.prisma.application.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
      },
      include: {
        applicant: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        batch: {
          include: { course: { select: { title: true, code: true } } },
        },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { batch: { include: { course: true, tenant: true } } },
    });
    if (!app) throw new I18nNotFoundException('messages.application.notFound');
    return app;
  }
}
