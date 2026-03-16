import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto, CourseListResponseDto } from './dto';
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
  ApiConsumes,
} from '@nestjs/swagger';
import { CourseEntity } from './entities/course.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ParseFormDataJsonInterceptor } from '@/common/interceptors/parse-form-data-json.interceptor';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/infrastructure/prisma/client/client';

@ApiTags('Courses')
@Controller('courses')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnailFile', maxCount: 1 },
      { name: 'bannerFile', maxCount: 1 },
      { name: 'introVideoFile', maxCount: 1 },
    ]),
    ParseFormDataJsonInterceptor,
  )
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid course data' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  create(
    @CurrentUser() user: User,
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles()
    files: {
      thumbnailFile?: Express.Multer.File[];
      bannerFile?: Express.Multer.File[];
      introVideoFile?: Express.Multer.File[];
    },
  ) {
    return this.courseService.create(user.id, createCourseDto, {
      thumbnailFile: files?.thumbnailFile?.[0],
      bannerFile: files?.bannerFile?.[0],
      introVideoFile: files?.introVideoFile?.[0],
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all courses with filters and pagination (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of courses with total count',
    type: CourseListResponseDto,
  })
  findAll(@Query() query: CourseQueryDto) {
    return this.courseService.findAll(query);
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
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update course details (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnailFile', maxCount: 1 },
      { name: 'bannerFile', maxCount: 1 },
      { name: 'introVideoFile', maxCount: 1 },
    ]),
    ParseFormDataJsonInterceptor,
  )
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
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFiles()
    files: {
      thumbnailFile?: Express.Multer.File[];
      bannerFile?: Express.Multer.File[];
      introVideoFile?: Express.Multer.File[];
    },
  ) {
    return this.courseService.update(user.id, id, updateCourseDto, {
      thumbnailFile: files?.thumbnailFile?.[0],
      bannerFile: files?.bannerFile?.[0],
      introVideoFile: files?.introVideoFile?.[0],
    });
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
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
