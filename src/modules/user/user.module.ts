import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { GradesModule } from '@/modules/grades/grades.module';

@Module({
  imports: [PrismaModule, GradesModule],
  controllers: [UserController, UserProfileController],
  providers: [UserService, UserProfileService],
  exports: [UserService, UserProfileService],
})
export class UserModule {}
