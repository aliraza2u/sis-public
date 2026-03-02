import { Injectable, Inject } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { TokenService } from '@/common/services/token.service';
import { HashingService } from '@/common/services/hashing.service';

import { LoginRequestDto } from '@/modules/auth/dto/login.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { I18nService } from 'nestjs-i18n';
import { User } from '@/infrastructure/prisma/client/client';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { EmailService } from '@/modules/email/email.service';
import {
  I18nUnauthorizedException,
  I18nBadRequestException,
} from '@/common/exceptions/i18n.exception';
import { CheckEmailDto, RequestSetupDto, SetupPasswordDto } from '@/modules/auth/dto/auth-flow.dto';
import { TranslationHelperService } from '@/common/services/translation-helper.service';
import { t } from '@/common/helpers/i18n.helper';
import { UserAuthState } from '@/common/enums/auth-state.enum';

import { UserService } from '@/modules/user/user.service';

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

    if (!user.passwordHash) {
      throw new I18nBadRequestException('messages.auth.setupRequired');
    }

    const isPasswordValid = await this.hashingService.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new I18nUnauthorizedException('messages.auth.invalidCredentials');
    }

    if (!user.isPasswordCreated) {
      throw new I18nBadRequestException('messages.auth.setupRequired');
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

  async checkEmail(dto: CheckEmailDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      return {
        status: UserAuthState.NOT_FOUND,
        message: t('messages.auth.emailNotFound'),
      };
    }

    if (!user.isPasswordCreated) {
      return {
        status: UserAuthState.SETUP_REQUIRED,
        message: t('messages.auth.setupRequired'),
      };
    }

    return {
      status: UserAuthState.LOGIN_REQUIRED,
      message: t('messages.auth.loginRequired'),
    };
  }

  async requestPasswordSetup(dto: RequestSetupDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      return { message: t('messages.auth.passwordSetupLinkSent') };
    }

    if (user.isPasswordCreated) {
      throw new I18nBadRequestException('messages.auth.alreadySetup');
    }

    const setupToken = this.tokenService.generate();
    const expires = this.tokenService.getExpirationDate(this.authConfiguration.passwordResetExpiry);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: setupToken,
        passwordResetExpires: expires,
      },
    });

    await this.emailService.sendPasswordSetupEmail(
      user.email,
      setupToken,
      user.preferredLanguageCode || 'en',
    );

    return { message: t('messages.auth.passwordSetupLinkSent') };
  }

  async setupPassword(dto: SetupPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new I18nBadRequestException('messages.auth.invalidResetToken');
    }

    const hashedPassword = await this.hashingService.hash(dto.password);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        isPasswordCreated: true,
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    });

    const tokens = await this.generateTokens(updatedUser);
    await this.updateRefreshToken(updatedUser.id, tokens.refresh_token);

    return {
      ...tokens,
      user: new UserEntity(updatedUser),
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
    await this.updateRefreshToken(user.id, tokens.refresh_token, refreshToken);

    return tokens;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: t('messages.auth.passwordResetLinkSent') };
    }

    // If user hasn't set up their account yet, send them to the setup flow
    if (!user.isPasswordCreated) {
      return this.requestPasswordSetup({ email: user.email });
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

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.preferredLanguageCode || 'en',
    );

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
        isPasswordCreated: true, // Mark as created upon successful reset
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true, // Resetting password implicitly verifies email
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    });

    return { message: t('messages.auth.passwordResetSuccess') };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
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
