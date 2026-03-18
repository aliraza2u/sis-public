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
import { I18nForbiddenException, I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { UpsertManualGradeDto } from './dto';
import { TranscriptCourseDto } from './dto/transcript.dto';
import { GenerateTranscriptResponseDto } from './dto/generate-transcript.dto';
import { VerifyTranscriptResponseDto } from './dto/verify-transcript.dto';
import { StudentOverviewResponseDto } from './dto/student-overview.dto';

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
  @ApiOperation({
    summary: 'Set or update manual grade by student user ID and course ID (Admin only)',
    description:
      'Body: userId, courseId, finalResult, optional finalGrade/finalScore. Application is linked when an approved enrollment exists.',
  })
  @ApiResponse({ status: 201, description: 'Grade saved' })
  @ApiResponse({ status: 404, description: 'User or course not found in tenant' })
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
  @ApiOperation({
    summary: 'Get transcript (course grades) for a student',
    description:
      'Returns all graded courses for the user, or only the given course when courseId query is set.',
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'If provided, returns grades for this course only (for that user)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of course grades in transcript format (0 or 1 items when courseId is set)',
    type: [TranscriptCourseDto],
  })
  async getTranscript(
    @Param('userId') userId: string,
    @Query('courseId') courseId: string | undefined,
    @CurrentUser() user: UserEntity,
  ): Promise<TranscriptCourseDto[]> {
    const canViewOthers = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some(
      (r) => user.roles?.includes(r),
    );
    if (!canViewOthers && user.id !== userId) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    const tenantId = this.cls.get<string>('tenantId');
    const cid = courseId?.trim() || undefined;
    return this.gradesService.getTranscript(tenantId, userId, cid);
  }

  @Post('transcript/generate/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.student, UserRole.admin, UserRole.super_admin, UserRole.reviewer)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate transcript for a student',
    description:
      'Generates a transcript (or returns existing). Pass optional courseId to get only that course\'s grade; otherwise all courses for the user.',
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'If provided, response transcript array contains only this course\'s grade for the user',
  })
  @ApiResponse({
    status: 201,
    description: 'Transcript generated or existing returned',
    type: GenerateTranscriptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transcript not found or user has no grades' })
  async generateTranscript(
    @Param('userId') userId: string,
    @CurrentUser() user: UserEntity,
    @Query('courseId') courseId?: string,
  ): Promise<GenerateTranscriptResponseDto> {
    const tenantId = this.cls.get<string>('tenantId');
    const canGenerateForOthers = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some(
      (r) => user.roles?.includes(r),
    );
    if (!canGenerateForOthers && user.id !== userId) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    return this.gradesService.generateTranscript(tenantId, userId, courseId);
  }
}
