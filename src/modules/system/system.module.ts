import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataTransferModule } from '@/modules/data-transfer/data-transfer.module';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [ConfigModule, DataTransferModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
