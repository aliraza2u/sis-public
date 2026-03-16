import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationListResponseDto, ApplicationQueryDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
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
    description: 'Paginated list of applications for the current user',
    type: ApplicationListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires student role' })
  findMyApplications(@CurrentUser() user: UserEntity, @Query() query: ApplicationQueryDto) {
    return this.applicationService.findMyApplications(user.id, query);
  }

  @Get('applications')
  @Roles(UserRole.admin, UserRole.super_admin, UserRole.reviewer)
  @ApiOperation({
    summary: 'List all applications with filters and pagination (Admin/Reviewer only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of applications',
    type: ApplicationListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin, super_admin, or reviewer role' })
  findAll(@Query() query: ApplicationQueryDto) {
    return this.applicationService.findAll(query);
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
