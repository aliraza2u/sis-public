import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import {
  CreateBatchDto,
  UpdateBatchDto,
  BatchQueryDto,
  BatchListResponseDto,
} from './dto/batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { BatchEntity } from './entities/batch.entity';

@ApiTags('Batches')
@Controller()
@ApiBearerAuth()
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('batches')
  @Public()
  @ApiOperation({ summary: 'List all batches with filters and pagination (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of batches',
    type: BatchListResponseDto,
  })
  findAll(@Query() query: BatchQueryDto) {
    return this.batchService.findAll(query);
  }

  @Get('my-batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Get the batches assigned to the current student' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of approved batches for the student',
    type: BatchListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No assigned batch found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires student role' })
  findMyBatch(@CurrentUser() user: UserEntity, @Query() query: BatchQueryDto) {
    return this.batchService.findStudentBatches(user.id, query);
  }

  @Post('courses/:courseId/batches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Create a new batch for a course (Admin only)' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch created successfully',
    type: BatchEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid batch data' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  create(@Param('courseId') courseId: string, @Body() createBatchDto: CreateBatchDto) {
    return this.batchService.create(courseId, createBatchDto);
  }

  @Get('courses/:courseId/batches')
  @ApiOperation({ summary: 'List batches for a course with filters and pagination' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of batches for the course',
    type: BatchListResponseDto,
  })
  findAllForCourse(@Param('courseId') courseId: string, @Query() query: BatchQueryDto) {
    return this.batchService.findAll({ ...query, courseId });
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get batch details by ID' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: 'BAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch details with course information',
    type: BatchEntity,
  })
  @ApiNotFoundResponse({ description: 'Batch not found' })
  findOne(@Param('id') id: string) {
    return this.batchService.findOne(id);
  }

  @Patch('batches/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update batch details (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: 'BAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch updated successfully',
    type: BatchEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid batch data' })
  @ApiNotFoundResponse({ description: 'Batch not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
    return this.batchService.update(id, updateBatchDto);
  }

  @Delete('batches/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Soft delete a batch (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: 'BAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch deleted successfully (soft delete)',
    type: BatchEntity,
  })
  @ApiNotFoundResponse({ description: 'Batch not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  remove(@Param('id') id: string) {
    return this.batchService.remove(id);
  }
}
