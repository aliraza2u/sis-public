import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    return new UserEntity({
      ...user,
      tenant: user.tenant,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });
  }
}
