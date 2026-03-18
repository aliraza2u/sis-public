import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import {
  I18nNotFoundException,
  I18nBadRequestException,
} from '@/common/exceptions/i18n.exception';
import { GradesService } from '@/modules/grades/grades.service';
import type { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly gradesService: GradesService,
    private readonly cls: ClsService,
  ) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    let academicSummary: Awaited<ReturnType<GradesService['getStudentOverview']>>['summary'] | undefined;
    let academicEnrollments: Awaited<ReturnType<GradesService['getStudentOverview']>>['enrollments'] | undefined;
    if (!user.deletedAt) {
      const overview = await this.gradesService.getStudentOverview(user.tenantId, user.id);
      academicSummary = overview.summary;
      academicEnrollments = overview.enrollments;
    }

    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    return new UserEntity({
      ...user,
      tenant: user.tenant,
      academicSummary,
      academicEnrollments,
      userProfile: userProfile ? new UserProfileEntity(userProfile as any) : null,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });
  }

  /** Admin dashboard: tenant-scoped counts only. */
  async getAdminDashboardStats(): Promise<AdminDashboardStatsDto> {
    const tenantId = this.cls.get<string>('tenantId');
    if (!tenantId) {
      throw new I18nBadRequestException('messages.tenant.contextRequired');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, totalCourses, totalImportJobs, activeUsersLast30Days, activeAccounts] =
      await Promise.all([
        this.prisma.user.count({ where: {} }),
        this.prisma.course.count({ where: {} }),
        this.prisma.importJob.count({ where: {} }),
        this.prisma.user.count({
          where: { lastLoginAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.user.count({ where: { isActive: true } }),
      ]);

    return {
      totalUsers,
      totalCourses,
      totalImportJobs,
      activeUsersLast30Days,
      activeAccounts,
    };
  }
}
