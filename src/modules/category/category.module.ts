import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [PrismaModule, ClsModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
