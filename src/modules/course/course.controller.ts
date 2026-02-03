import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
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
import { CourseEntity } from './entities/course.entity';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums/roles.enum';

@ApiTags('Courses')
@Controller('courses')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid course data' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all courses (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all courses sorted by creation date',
    type: [CourseEntity],
  })
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get course details by ID (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Course details',
    type: CourseEntity,
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update course details (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid course data' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a course (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: 'CRS-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully (soft delete)',
    type: CourseEntity,
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
