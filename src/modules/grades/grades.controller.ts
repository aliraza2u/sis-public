import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/infrastructure/prisma/client/client';
import { I18nForbiddenException } from '@/common/exceptions/i18n.exception';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { UpsertManualGradeDto } from './dto';
import { TranscriptCourseDto } from './dto/transcript.dto';
import { GenerateTranscriptResponseDto } from './dto/generate-transcript.dto';
import { VerifyTranscriptResponseDto } from './dto/verify-transcript.dto';

@ApiTags('Grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly cls: ClsService,
  ) {}

  @Post('manual')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Set or update manual grade for an enrollment (Admin only)' })
  @ApiResponse({ status: 201, description: 'Grade saved' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async upsertManualGrade(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpsertManualGradeDto,
  ) {
    const tenantId = this.cls.get<string>('tenantId');
    return this.gradesService.upsertManualGrade(tenantId, dto);
  }

  @Get('transcript/verify')
  @Public()
  @ApiOperation({
    summary: 'Verify transcript',
    description:
      'Verifies a transcript using token (from link) or transcript ID. Public, no auth required.',
  })
  @ApiQuery({ name: 'token', required: false, description: 'Verification token' })
  @ApiQuery({ name: 'transcriptId', required: false, description: 'Transcript ID' })
  @ApiResponse({
    status: 200,
    description: 'Transcript verification result',
    type: VerifyTranscriptResponseDto,
  })
  async verifyTranscript(
    @Query('token') token?: string,
    @Query('transcriptId') transcriptId?: string,
  ): Promise<VerifyTranscriptResponseDto> {
    return this.gradesService.verifyTranscript(token, transcriptId);
  }

  @Get('transcript/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin, UserRole.student, UserRole.reviewer)
  @ApiOperation({ summary: 'Get transcript (course grades) for a student' })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiResponse({
    status: 200,
    description: 'List of course grades in transcript format',
    type: [TranscriptCourseDto],
  })
  async getTranscript(
    @Param('userId') userId: string,
    @CurrentUser() user: UserEntity,
  ): Promise<TranscriptCourseDto[]> {
    const canViewOthers = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some(
      (r) => user.roles?.includes(r),
    );
    if (!canViewOthers && user.id !== userId) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    const tenantId = this.cls.get<string>('tenantId');
    return this.gradesService.getTranscript(tenantId, userId);
  }

  @Post('transcript/generate/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.student, UserRole.admin, UserRole.super_admin, UserRole.reviewer)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate transcript for a student',
    description:
      'Generates a transcript (or returns existing) for the student. Returns a verification token and URL for public verification.',
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiResponse({
    status: 201,
    description: 'Transcript generated or existing returned',
    type: GenerateTranscriptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transcript not found or user has no grades' })
  async generateTranscript(
    @Param('userId') userId: string,
    @CurrentUser() user: UserEntity,
  ): Promise<GenerateTranscriptResponseDto> {
    const tenantId = this.cls.get<string>('tenantId');
    const canGenerateForOthers = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some(
      (r) => user.roles?.includes(r),
    );
    if (!canGenerateForOthers && user.id !== userId) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    return this.gradesService.generateTranscript(tenantId, userId);
  }
}
