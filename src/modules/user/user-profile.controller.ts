import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto, UpdateUserProfileDto, FilterUserProfileDto } from './dto/user-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserProfileDetailResponseDto } from './dto/user-profile-detail.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UserRole } from '@/common/enums';
import { I18nForbiddenException } from '@/common/exceptions/i18n.exception';

@ApiTags('User Profiles')
@Controller('user-profiles')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Create a new user profile' })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully',
    type: UserProfileDetailResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data or profile already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  create(@Body() createUserProfileDto: CreateUserProfileDto) {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'List all user profiles with filtering and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term (searches in nationality, nationalId, passportNo)',
    example: 'Saudi',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    description: 'Filter by gender',
    enum: ['male', 'female'],
    example: 'male',
  })
  @ApiQuery({
    name: 'nationality',
    required: false,
    description: 'Filter by nationality',
    example: 'Saudi Arabia',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
    example: 'USR-123e4567',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    enum: ['active', 'inactive', 'graduated'],
    example: 'active',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'dateOfBirth'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user profiles with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserProfileEntity' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin, super_admin, or reviewer role' })
  findAll(@Query() filterDto: FilterUserProfileDto) {
    return this.userProfileService.findAll(filterDto);
  }

  @Get('by-user/:userId')
  @Roles(UserRole.admin, UserRole.super_admin, UserRole.reviewer, UserRole.student)
  @ApiOperation({ summary: 'Get user profile by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'USR-123e4567',
  })
  @ApiResponse({
    status: 200,
    description: 'User + profile (profile null if not created yet)',
    type: UserProfileDetailResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found in tenant' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findByUserId(@Param('userId') userId: string, @CurrentUser() current: UserEntity) {
    const isStaff = [UserRole.admin, UserRole.super_admin, UserRole.reviewer].some((r) =>
      current.roles?.includes(r),
    );
    if (!isStaff && current.id !== userId) {
      throw new I18nForbiddenException('messages.forbidden');
    }
    return this.userProfileService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.super_admin, UserRole.reviewer, UserRole.student)
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({
    name: 'id',
    description: 'User Profile ID', 
    example: 'UPF-123e4567',
  })
  @ApiResponse({
    status: 200,
    description: 'User + profile details',
    type: UserProfileDetailResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User profile not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findOne(@Param('id') id: string, @CurrentUser() current: UserEntity) {
    return this.userProfileService.findOneForViewer(id, current);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update user profile by ID' })
  @ApiParam({
    name: 'id',
    description: 'User Profile ID',
    example: 'UPF-123e4567',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileDetailResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiNotFoundResponse({ description: 'User profile not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateUserProfileDto: UpdateUserProfileDto) {
    return this.userProfileService.update(id, updateUserProfileDto);
  }

  @Patch('by-user/:userId')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Update user profile by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'USR-123e4567',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileDetailResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiNotFoundResponse({ description: 'User profile not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  updateByUserId(
    @Param('userId') userId: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.updateByUserId(userId, updateUserProfileDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: 'Delete user profile by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'User Profile ID',
    example: 'UPF-123e4567',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'User profile not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Requires admin or super_admin role' })
  remove(@Param('id') id: string) {
    return this.userProfileService.remove(id);
  }
}

