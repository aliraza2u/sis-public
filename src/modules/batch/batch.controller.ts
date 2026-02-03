import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/roles.enum';
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
  @ApiOperation({ summary: 'List all active batches open for enrollment (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of active batches with enrollment windows open',
    type: [BatchEntity],
  })
  findAllActive() {
    return this.batchService.findAllActive();
  }

  @Post('courses/:courseId/batches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiOperation({ summary: 'List all batches for a specific course' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'List of batches for the course sorted by start date',
    type: [BatchEntity],
  })
  findAll(@Param('courseId') courseId: string) {
    return this.batchService.findAll(courseId);
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
