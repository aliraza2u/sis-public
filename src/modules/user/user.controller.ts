import {
  Controller,
  Get,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';

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
}
