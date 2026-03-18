import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums';
import { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';
import { CreateAdminDto, UpdateAdminDto, FilterAdminDto } from './dto/admin.dto';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserEntity,
  })
  getMe(@CurrentUser() user: UserEntity) {
    return this.userService.findOne(user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'List all admins with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'List of admins retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/UserEntity' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  findAll(@Query() filterDto: FilterAdminDto) {
    return this.userService.getAdmins(filterDto);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Create a new admin' })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
    type: UserEntity,
  })
  @ApiBadRequestResponse({ description: 'User already exists' })
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.userService.createAdmin(createAdminDto);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update an admin' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Admin updated successfully',
    type: UserEntity,
  })
  updateAdmin(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.userService.updateAdmin(id, updateAdminDto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Soft delete an admin' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  deleteAdmin(@Param('id') id: string) {
    return this.userService.deleteAdmin(id);
  }

  @Get('admin/dashboard-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({
    summary: 'Admin dashboard statistics (tenant-scoped)',
    description: 'Total users, courses, import jobs, active users (30d login + active accounts).',
  })
  @ApiResponse({ status: 200, description: 'Dashboard stats', type: AdminDashboardStatsDto })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin' })
  getAdminDashboardStats() {
    return this.userService.getAdminDashboardStats();
  }
}
