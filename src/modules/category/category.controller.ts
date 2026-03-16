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
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CategoryListResponseDto,
} from './dto/category.dto';
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
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CategoryEntity } from './entities/category.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums';

@ApiTags('Categories')
@Controller('categories')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid category data' })
  @ApiConflictResponse({ description: 'Category slug already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List categories with filters and pagination (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of categories',
    type: CategoryListResponseDto,
  })
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category details by ID (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'CAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: CategoryEntity,
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update category details (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'CAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryEntity,
  })
  @ApiBadRequestResponse({ description: 'Invalid category data' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiConflictResponse({ description: 'Category slug already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Soft delete a category (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'CAT-123e4567-e89b-12d3',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully (soft delete)',
    type: CategoryEntity,
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
