import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import {
  I18nNotFoundException,
  I18nBadRequestException,
  I18nForbiddenException,
  I18nException,
} from '@/common/exceptions/i18n.exception';
import { GradesService } from '@/modules/grades/grades.service';
import { EmailService } from '@/modules/email/email.service';
import { CreateAdminDto, UpdateAdminDto, FilterAdminDto } from './dto/admin.dto';
import { UserRole } from '@/common/enums';
import type { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly gradesService: GradesService,
    private readonly emailService: EmailService,
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

    let academicSummary:
      | Awaited<ReturnType<GradesService['getStudentOverview']>>['summary']
      | undefined;
    let academicEnrollments:
      | Awaited<ReturnType<GradesService['getStudentOverview']>>['enrollments']
      | undefined;
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

  async createAdmin(dto: CreateAdminDto) {
    const tenantId = this.cls.get<string>('tenantId');
    if (!tenantId) throw new I18nBadRequestException('messages.tenant.contextRequired');

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { email: dto.email, tenantId },
      });

      if (existingUser) {
        throw new I18nBadRequestException('messages.auth.userExists');
      }

      const newAdmin = await tx.user.create({
        data: {
          tenantId,
          email: dto.email,
          firstName: dto.firstName as any,
          lastName: dto.lastName as any,
          roles: [dto.role || UserRole.admin],
          preferredLanguageCode: dto.preferredLanguageCode || 'en',
          isPasswordCreated: false,
          isActive: true,
        },
      });

      try {
        await this.emailService.sendAdminCongratulationsEmail(newAdmin.email);
      } catch (error) {
        this.logger.error(
          `Failed to send admin congratulations email to ${newAdmin.email}: ${error.message}`,
        );
        // Rethrow if it's a known i18n exception to provide "proper error message"
        if (error instanceof I18nException) {
          throw error;
        }
        // Otherwise wrap in a generic but descriptive one
        throw error;
      }

      return new UserEntity({ ...newAdmin, tenant: null as any });
    });
  }

  async updateAdmin(id: string, dto: UpdateAdminDto) {
    const tenantId = this.cls.get<string>('tenantId');

    return this.prisma.$transaction(async (tx) => {
      const existingAdmin = await tx.user.findUnique({
        where: { id },
      });

      if (!existingAdmin) {
        throw new I18nNotFoundException('messages.user.userNotFound');
      }

      if (existingAdmin.tenantId !== tenantId) {
        throw new I18nForbiddenException('messages.forbidden');
      }

      if (!existingAdmin.roles.includes(UserRole.admin)) {
        throw new I18nBadRequestException('messages.forbidden');
      }

      const updatedAdmin = await tx.user.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName as any }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName as any }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.role !== undefined && { roles: [dto.role] }),
          ...(dto.preferredLanguageCode !== undefined && {
            preferredLanguageCode: dto.preferredLanguageCode,
          }),
        },
      });

      try {
        await this.emailService.sendAdminUpdatedEmail(updatedAdmin.email);
      } catch (error) {
        this.logger.error(
          `Failed to send admin updated email to ${updatedAdmin.email}: ${error.message}`,
        );
        if (error instanceof I18nException) {
          throw error;
        }
        throw error;
      }

      return new UserEntity({ ...updatedAdmin, tenant: null as any });
    });
  }

  async deleteAdmin(id: string) {
    const tenantId = this.cls.get<string>('tenantId');
    const currentUserId = this.cls.get<string>('userId');

    return this.prisma.$transaction(async (tx) => {
      const adminToDelete = await tx.user.findUnique({
        where: { id },
      });

      if (!adminToDelete) {
        throw new I18nNotFoundException('messages.user.userNotFound');
      }

      if (adminToDelete.tenantId !== tenantId) {
        throw new I18nForbiddenException('messages.forbidden');
      }

      if (adminToDelete.roles.includes(UserRole.super_admin)) {
        throw new I18nBadRequestException('messages.forbidden');
      }

      if (!adminToDelete.roles.includes(UserRole.admin)) {
        throw new I18nBadRequestException('messages.forbidden');
      }

      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: currentUserId,
          isActive: false,
        },
      });

      try {
        await this.emailService.sendAdminDeletedEmail(adminToDelete.email);
      } catch (error) {
        this.logger.error(
          `Failed to send admin deleted email to ${adminToDelete.email}: ${error.message}`,
        );
        if (error instanceof I18nException) {
          throw error;
        }
        throw error;
      }
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

  async getAdmins(filterDto: FilterAdminDto = {}) {
    const tenantId = this.cls.get<string>('tenantId');
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      roles: {
        has: UserRole.admin,
      },
    };

    if (search) {
      where.OR = [
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
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => new UserEntity(user as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
