import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';

import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

import { LoginRequestDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserEntity } from '../user/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/roles.enum';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  login(@Body() dto: LoginRequestDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(@CurrentUser() user: UserEntity) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  verifyEmail(@Query('token') token: string) {
    // Query param for link clicking
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // Stricter limit for emails
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'User already verified' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Admin only endpoint' })
  @ApiResponse({ status: 200, description: 'Hello Admin' })
  adminOnly() {
    return { message: 'Hello Admin' }; // Must match RBAC test expectation
  }
}
