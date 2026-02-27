import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from '@/modules/auth/auth.service';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto';
import { LoginRequestDto } from '@/modules/auth/dto/login.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { CheckEmailDto, RequestSetupDto, SetupPasswordDto } from '@/modules/auth/dto/auth-flow.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserAuthState } from '@/common/enums/auth-state.enum';

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
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check email status (Identifier-first)' })
  @ApiResponse({
    status: 200,
    description: `User state: ${Object.values(UserAuthState).join(', ')}`,
  })
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto);
  }

  @Public()
  @Post('request-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request account setup email' })
  @ApiResponse({
    status: 200,
    description: 'Setup link sent if email is registered and uninitialized',
  })
  requestSetup(@Body() dto: RequestSetupDto) {
    return this.authService.requestPasswordSetup(dto);
  }

  @Public()
  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set initial password' })
  @ApiResponse({ status: 200, description: 'Password set successfully, returns tokens' })
  setupPassword(@Body() dto: SetupPasswordDto) {
    return this.authService.setupPassword(dto);
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
}
