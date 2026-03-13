import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { CreateUserProfileDto, UpdateUserProfileDto, FilterUserProfileDto } from './dto/user-profile.dto';
import { UserProfileEntity } from './entities/user-profile.entity';
import {
  I18nNotFoundException,
  I18nForbiddenException,
} from '@/common/exceptions/i18n.exception';
import { Prisma } from '@/infrastructure/prisma/client/client';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfileEntity> {
    const tenantId = this.cls.get<string>('tenantId');
    const userId = createUserProfileDto.userId || this.cls.get<string>('userId');

    if (!userId) {
      throw new I18nForbiddenException('messages.userProfile.userIdRequired');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new I18nForbiddenException('messages.userProfile.alreadyExists');
    }

    // Verify user belongs to the same tenant
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

    return new UserProfileEntity(profile as any);
  }

  async findOne(id: string): Promise<UserProfileEntity> {
    const tenantId = this.cls.get<string>('tenantId');
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new I18nNotFoundException('messages.userProfile.notFound');
    }

    if (profile.tenantId !== tenantId) {
      throw new I18nForbiddenException('messages.userProfile.tenantMismatch');
    }

    return new UserProfileEntity(profile as any);
  }

  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const tenantId = this.cls.get<string>('tenantId');

    // Verify user belongs to the same tenant
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

    if (!profile) {
      return null;
    }

    return new UserProfileEntity(profile as any);
  }

  async findAll(filterDto: FilterUserProfileDto = {}): Promise<{
    data: UserProfileEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId = this.cls.get<string>('tenantId');
    const { search, gender, nationality, userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filterDto;

    // Build where clause
    const where: Prisma.UserProfileWhereInput = {
      tenantId,
    };

    // Add filters
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

    // Add search functionality
    if (search) {
      where.OR = [
        { nationality: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { passportNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.UserProfileOrderByWithRelationInput = {};
    if (sortBy === 'dateOfBirth') {
      orderBy.dateOfBirth = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
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
      data: data.map((profile) => new UserProfileEntity(profile)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileEntity> {
    // Check if profile exists and belongs to tenant (findOne already validates tenant)
    await this.findOne(id);
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

    return new UserProfileEntity(updatedProfile);
  }

  async updateByUserId(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfileEntity> {
    const tenantId = this.cls.get<string>('tenantId');
    
    // Verify user belongs to the same tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

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
    // Check if profile exists and belongs to tenant
    await this.findOne(id);
    await this.prisma.userProfile.delete({
      where: { id },
    });
  }
}

