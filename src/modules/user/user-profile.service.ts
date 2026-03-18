import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { CreateUserProfileDto, UpdateUserProfileDto, FilterUserProfileDto } from './dto/user-profile.dto';
import { UserProfileEntity } from './entities/user-profile.entity';
import {
  I18nNotFoundException,
  I18nForbiddenException,
} from '@/common/exceptions/i18n.exception';
import { Prisma, User } from '@/infrastructure/prisma/client/client';
import { GradesService } from '@/modules/grades/grades.service';
import { UserPublicDto } from './dto/user-public.dto';
import {
  UserProfileDetailResponseDto,
  UserProfileDataDto,
} from './dto/user-profile-detail.dto';
import { UserRole } from '@/common/enums';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly gradesService: GradesService,
  ) {}

  private toUserPublic(u: User): UserPublicDto {
    return {
      id: u.id,
      tenantId: u.tenantId,
      email: u.email,
      firstName: (u.firstName as Record<string, string>) ?? {},
      lastName: (u.lastName as Record<string, string>) ?? {},
      phone: u.phone,
      roles: u.roles as UserRole[],
      avatarUrl: u.avatarUrl,
      emailVerified: u.emailVerified,
      emailVerifiedAt: u.emailVerifiedAt,
      preferredLanguageCode: u.preferredLanguageCode,
      lastLoginAt: u.lastLoginAt,
      isActive: u.isActive,
      isPasswordCreated: u.isPasswordCreated,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      createdBy: u.createdBy,
      updatedBy: u.updatedBy,
    };
  }

  private toProfileData(p: {
    id: string;
    userId: string;
    tenantId: string;
    dateOfBirth: Date | null;
    gender: UserProfileDataDto['gender'];
    nationality: string | null;
    nationalId: string | null;
    passportNo: string | null;
    status: UserProfileDataDto['status'];
    address: unknown;
    guardian: unknown;
    education: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfileDataDto {
    return {
      id: p.id,
      userId: p.userId,
      tenantId: p.tenantId,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      nationality: p.nationality,
      nationalId: p.nationalId,
      passportNo: p.passportNo,
      status: p.status,
      address: p.address,
      guardian: p.guardian,
      education: p.education,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private async buildProfileDetailResponse(
    user: User,
    profile: {
      id: string;
      userId: string;
      tenantId: string;
      dateOfBirth: Date | null;
      gender: UserProfileDataDto['gender'];
      nationality: string | null;
      nationalId: string | null;
      passportNo: string | null;
      status: UserProfileDataDto['status'];
      address: unknown;
      guardian: unknown;
      education: unknown;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): Promise<UserProfileDetailResponseDto> {
    const out: UserProfileDetailResponseDto = {
      user: this.toUserPublic(user),
      profile: profile ? this.toProfileData(profile) : null,
    };
    if (!user.deletedAt) {
      try {
        const overview = await this.gradesService.getStudentOverview(user.tenantId, user.id);
        out.academicSummary = overview.summary;
        out.academicEnrollments = overview.enrollments;
      } catch {
        /* user may be invalid for overview */
      }
    }
    return out;
  }

  private async loadProfileWithUserForTenant(profileId: string) {
    const tenantId = this.cls.get<string>('tenantId');
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });
    if (!profile) {
      throw new I18nNotFoundException('messages.userProfile.notFound');
    }
    if (profile.tenantId !== tenantId) {
      throw new I18nForbiddenException('messages.userProfile.tenantMismatch');
    }
    return profile;
  }

  async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfileDetailResponseDto> {
    const tenantId = this.cls.get<string>('tenantId');
    const userId = createUserProfileDto.userId || this.cls.get<string>('userId');

    if (!userId) {
      throw new I18nForbiddenException('messages.userProfile.userIdRequired');
    }

    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new I18nForbiddenException('messages.userProfile.alreadyExists');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    if (user.tenantId !== tenantId) {
      throw new I18nForbiddenException('messages.userProfile.tenantMismatch');
    }

    const profile = await this.prisma.userProfile.create({
      data: {
        userId,
        tenantId,
        ...(createUserProfileDto.dateOfBirth && {
          dateOfBirth: new Date(createUserProfileDto.dateOfBirth),
        }),
        ...(createUserProfileDto.gender !== undefined && { gender: createUserProfileDto.gender }),
        ...(createUserProfileDto.nationality !== undefined && {
          nationality: createUserProfileDto.nationality,
        }),
        ...(createUserProfileDto.nationalId !== undefined && {
          nationalId: createUserProfileDto.nationalId,
        }),
        ...(createUserProfileDto.passportNo !== undefined && {
          passportNo: createUserProfileDto.passportNo,
        }),
        ...(createUserProfileDto.status !== undefined && { status: createUserProfileDto.status }),
        ...(createUserProfileDto.address !== undefined && {
          address: createUserProfileDto.address as any,
        }),
        ...(createUserProfileDto.guardian !== undefined && {
          guardian: createUserProfileDto.guardian as any,
        }),
        ...(createUserProfileDto.education !== undefined && {
          education: createUserProfileDto.education as any,
        }),
      },
    });

    return this.buildProfileDetailResponse(user, profile);
  }

  async findOneForViewer(
    profileId: string,
    current: { id: string; roles?: UserRole[] },
  ): Promise<UserProfileDetailResponseDto> {
    const profile = await this.loadProfileWithUserForTenant(profileId);
    const isStaff = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some((r) =>
      current.roles?.includes(r),
    );
    if (!isStaff && profile.userId !== current.id) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    return this.buildProfileDetailResponse(profile.user, profile);
  }

  async findByUserId(userId: string): Promise<UserProfileDetailResponseDto> {
    const tenantId = this.cls.get<string>('tenantId');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    if (user.tenantId !== tenantId) {
      throw new I18nForbiddenException('messages.userProfile.tenantMismatch');
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    return this.buildProfileDetailResponse(user, profile);
  }

  async findAll(filterDto: FilterUserProfileDto = {}): Promise<{
    data: UserProfileEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId = this.cls.get<string>('tenantId');
    const {
      search,
      gender,
      nationality,
      userId,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const where: Prisma.UserProfileWhereInput = {
      tenantId,
    };

    if (gender) {
      where.gender = gender;
    }

    if (nationality) {
      where.nationality = {
        contains: nationality,
        mode: 'insensitive',
      };
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      (where as any).status = status;
    }

    if (search) {
      where.OR = [
        { nationality: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { passportNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserProfileOrderByWithRelationInput = {};
    if (sortBy === 'dateOfBirth') {
      orderBy.dateOfBirth = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userProfile.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.userProfile.count({ where }),
    ]);

    return {
      data: data.map((p) => new UserProfileEntity(p as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileDetailResponseDto> {
    await this.loadProfileWithUserForTenant(id);
    const updatedProfile = await this.prisma.userProfile.update({
      where: { id },
      data: {
        ...(updateUserProfileDto.dateOfBirth && {
          dateOfBirth: new Date(updateUserProfileDto.dateOfBirth),
        }),
        ...(updateUserProfileDto.gender !== undefined && { gender: updateUserProfileDto.gender }),
        ...(updateUserProfileDto.nationality !== undefined && {
          nationality: updateUserProfileDto.nationality,
        }),
        ...(updateUserProfileDto.nationalId !== undefined && {
          nationalId: updateUserProfileDto.nationalId,
        }),
        ...(updateUserProfileDto.passportNo !== undefined && {
          passportNo: updateUserProfileDto.passportNo,
        }),
        ...(updateUserProfileDto.status !== undefined && { status: updateUserProfileDto.status }),
        ...(updateUserProfileDto.address !== undefined && {
          address: updateUserProfileDto.address as any,
        }),
        ...(updateUserProfileDto.guardian !== undefined && {
          guardian: updateUserProfileDto.guardian as any,
        }),
        ...(updateUserProfileDto.education !== undefined && {
          education: updateUserProfileDto.education as any,
        }),
      },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: updatedProfile.userId },
    });
    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }
    return this.buildProfileDetailResponse(user, updatedProfile);
  }

  async updateByUserId(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfileDetailResponseDto> {
    const tenantId = this.cls.get<string>('tenantId');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    console.log("🚀 ~ UserProfileService ~ updateByUserId ~ user:", user)

    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    if (user.tenantId !== tenantId) {
      throw new I18nForbiddenException('messages.userProfile.tenantMismatch');
    }

    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new I18nNotFoundException('messages.userProfile.notFound');
    }

    return this.update(existingProfile.id, updateUserProfileDto);
  }

  async remove(id: string): Promise<void> {
    await this.loadProfileWithUserForTenant(id);
    await this.prisma.userProfile.delete({
      where: { id },
    });
  }
}
