import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IpAddress } from '@/common/decorators/ip-address.decorator';
import { UserAgent } from '@/common/decorators/user-agent.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ApplicationEntity } from './entities/application.entity';
import { UserEntity } from '../user/entities/user.entity';

@ApiTags('Applications')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('my-applications')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Get current user applications (Student only)' })
  @ApiResponse({
    status: 200,
    description: 'List of applications for the current user',
    type: [ApplicationEntity],
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires student role' })
  findMyApplications(@CurrentUser() user: UserEntity) {
    return this.applicationService.findMyApplications(user.id);
  }

  @Get('applications')
  @Roles(UserRole.admin, UserRole.super_admin, UserRole.reviewer)
  @ApiOperation({
    summary: 'List all applications with optional batch filter (Admin/Reviewer only)',
  })
  @ApiQuery({
    name: 'batchId',
    required: false,
    description: 'Filter by batch ID',
    example: 'BAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'List of applications sorted by creation date',
    type: [ApplicationEntity],
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin, super_admin, or reviewer role' })
  findAll(@Query('batchId') batchId?: string) {
    return this.applicationService.findAll(batchId);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get application details by ID' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
    example: 'APP-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Application details with batch and course info',
    type: ApplicationEntity,
  })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  findOne(@Param('id') id: string) {
    // TODO: Add ownership check if student
    return this.applicationService.findOne(id);
  }
}
