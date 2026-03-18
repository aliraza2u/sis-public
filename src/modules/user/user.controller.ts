import {
  Controller,
  Get,
  Request,
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
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';

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
  getMe(@Request() req) {
    return this.userService.findOne(req.user.id);
  }

  @Get('admin/dashboard-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({
    summary: 'Admin dashboard statistics (tenant-scoped)',
    description:
      'Total users, courses, import jobs, active users (30d login + active accounts).',
  })
  @ApiResponse({ status: 200, description: 'Dashboard stats', type: AdminDashboardStatsDto })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin' })
  getAdminDashboardStats() {
    return this.userService.getAdminDashboardStats();
  }
}
