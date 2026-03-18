import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataTransferController } from './data-transfer.controller';
import { DataTransferService } from './data-transfer.service';
import {
  CsvParserService,
  FileStorageService,
  ImportJobService,
  ImportProcessorService,
  ExportService,
} from './services';
import { CleanupService } from './cleanup.service';
import {
  RAW_IMPORT_STRATEGIES,
  TenantRawImportStrategy,
  UserRawImportStrategy,
  StudentGradesRawImportStrategy,
  GenericRawImportStrategy,
  RawImportStrategy,
} from './strategies';
import { STRATEGY_CONFIGS } from './config/import-strategies.config';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DataTransferController],
  providers: [
    DataTransferService,
    CsvParserService,
    FileStorageService,
    ImportJobService,
    ImportProcessorService,
    ExportService,
    CleanupService,

    // Explicit strategies (required for custom logic)
    TenantRawImportStrategy,
    UserRawImportStrategy,
    StudentGradesRawImportStrategy,

    // Factory to provide all raw import strategies
    {
      provide: RAW_IMPORT_STRATEGIES,
      useFactory: (
        prisma: PrismaService,
        tenantStrategy: TenantRawImportStrategy,
        userStrategy: UserRawImportStrategy,
        studentGradesStrategy: StudentGradesRawImportStrategy,
      ) => {
        const strategies: RawImportStrategy[] = [];

        strategies.push(tenantStrategy);
        strategies.push(userStrategy);
        strategies.push(studentGradesStrategy);

        // Add generic strategies for all other entities
        Object.values(STRATEGY_CONFIGS).forEach(({ config, sampleRow }) => {
          if (
            config.entityType === ImportEntityType.TENANT ||
            config.entityType === ImportEntityType.USER ||
            config.entityType === ImportEntityType.STUDENT_GRADES
          ) {
            return;
          }

          strategies.push(new GenericRawImportStrategy(prisma, config, sampleRow));
        });

        return strategies;
      },
      inject: [
        PrismaService,
        TenantRawImportStrategy,
        UserRawImportStrategy,
        StudentGradesRawImportStrategy,
      ],
    },
  ],
  exports: [
    DataTransferService,
    CsvParserService,
    TenantRawImportStrategy,
    UserRawImportStrategy,
    StudentGradesRawImportStrategy,
  ],
})
export class DataTransferModule {}
