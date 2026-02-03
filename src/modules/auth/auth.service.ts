import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { TokenService } from '@/common/services/token.service';
import { HashingService } from '@/common/services/hashing.service';

import { LoginRequestDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { I18nService } from 'nestjs-i18n';
import { User, Prisma } from '@/infrastructure/prisma/client/client';
import { UserEntity } from '../user/entities/user.entity';
import { EmailService } from '../email/email.service';
import { UserRole } from '@/common/enums/roles.enum';
import {
  I18nConflictException,
  I18nUnauthorizedException,
  I18nBadRequestException,
} from '@/common/exceptions/i18n.exception';
import { TranslationHelperService } from '@/common/services/translation-helper.service';
import { t } from '@/common/helpers/i18n.helper';

import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly translation: TranslationHelperService,
  ) {}

  async login(dto: LoginRequestDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new I18nUnauthorizedException('messages.auth.invalidCredentials');
    }

    const isPasswordValid = await this.hashingService.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new I18nUnauthorizedException('messages.auth.invalidCredentials');
    }

    if (!user.emailVerified) {
      throw new I18nUnauthorizedException('messages.auth.emailNotVerified');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: new UserEntity(user),
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: t('messages.auth.loggedOut') };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      // Possible reuse detection could go here
      throw new I18nUnauthorizedException('messages.auth.invalidRefreshToken');
    }

    if (tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new I18nUnauthorizedException('messages.auth.invalidRefreshToken');
    }

    const user = await this.prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) {
      throw new I18nUnauthorizedException('messages.user.userNotFound');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token, refreshToken); // Rotate

    return tokens;
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() }, // Check for expiration
      },
    });

    if (!user) {
      throw new I18nBadRequestException('messages.auth.invalidVerificationToken');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return { message: t('messages.auth.emailVerified') };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new I18nUnauthorizedException('messages.user.userNotFound');
    }

    if (user.emailVerified) {
      throw new I18nBadRequestException('messages.auth.alreadyVerified');
    }

    const verificationToken = this.tokenService.generate();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires: this.tokenService.getExpirationDate(
          this.authConfiguration.emailVerificationExpiry,
        ),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: t('messages.auth.verificationEmailSent') };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: t('messages.auth.passwordResetLinkSent') };
    }

    const resetToken = this.tokenService.generate();
    const expires = this.tokenService.getExpirationDate(this.authConfiguration.passwordResetExpiry);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expires,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: t('messages.auth.passwordResetLinkSent') };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() }, // Check expiration
      },
    });

    if (!user) {
      throw new I18nBadRequestException('messages.auth.invalidResetToken');
    }

    const hashedPassword = await this.hashingService.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: t('messages.auth.passwordResetSuccess') };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      jti: this.tokenService.generate(), // Use tokenService which wraps nanoid/uuid
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async updateRefreshToken(userId: string, refreshToken: string, oldToken?: string) {
    if (oldToken) {
      // Revoke the old token
      await this.prisma.refreshToken.update({
        where: { token: oldToken },
        data: { revoked: true, replacedByToken: refreshToken },
      });
    }

    // Calculate expiry based on config
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.authConfiguration.refreshTokenExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: expiresAt,
      },
    });
  }
}
