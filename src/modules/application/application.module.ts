import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { StudentIdService } from '@/common/services/student-id.service';
import { ClsModule } from 'nestjs-cls';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, ClsModule, EmailModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, StudentIdService],
})
export class ApplicationModule {}
