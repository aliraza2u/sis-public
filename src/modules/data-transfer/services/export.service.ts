import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CsvParserService } from '@/modules/data-transfer/services/csv-parser.service';
import { ExportEntityType } from '@/common/enums/export-entity-type.enum';
import {
  RAW_IMPORT_STRATEGIES,
  RawImportStrategy,
} from '../strategies/raw-import-strategy.interface';
import { BaseRawImportStrategy } from '../strategies/base-raw-import.strategy';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';
import { Prisma } from '@/infrastructure/prisma/client/client';

interface ExportColumn {
  key: string;
  header: string;
  transform?: (value: unknown) => string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private rawStrategyMap: Map<string, BaseRawImportStrategy> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvParser: CsvParserService,
    @Inject(RAW_IMPORT_STRATEGIES)
    private readonly rawStrategies: RawImportStrategy[],
  ) {
    for (const strategy of rawStrategies) {
      if (strategy instanceof BaseRawImportStrategy) {
        this.rawStrategyMap.set(strategy.getEntityType(), strategy);
      }
    }
  }

  private getModelName(entityType: ExportEntityType): Prisma.ModelName {
    const mapping: Record<ExportEntityType, Prisma.ModelName> = {
      [ExportEntityType.TENANT]: Prisma.ModelName.Tenant,
      [ExportEntityType.USER]: Prisma.ModelName.User,
      [ExportEntityType.CATEGORY]: Prisma.ModelName.Category,
      [ExportEntityType.COURSE]: Prisma.ModelName.Course,
      [ExportEntityType.BATCH]: Prisma.ModelName.Batch,
      [ExportEntityType.APPLICATION]: Prisma.ModelName.Application,
      [ExportEntityType.STUDENT_ID_COUNTER]: Prisma.ModelName.StudentIdCounter,
      [ExportEntityType.ACTIVITY_TYPE]: Prisma.ModelName.ActivityType,
      [ExportEntityType.MODULE]: Prisma.ModelName.Module,
      [ExportEntityType.MODULE_ITEM]: Prisma.ModelName.ModuleItem,
      [ExportEntityType.LESSON_CONTENT]: Prisma.ModelName.LessonContent,
      [ExportEntityType.QUIZ_CONTENT]: Prisma.ModelName.QuizContent,
      [ExportEntityType.QUIZ_QUESTION]: Prisma.ModelName.QuizQuestion,
      [ExportEntityType.QUIZ_OPTION]: Prisma.ModelName.QuizOption,
      [ExportEntityType.ASSIGNMENT_CONTENT]: Prisma.ModelName.AssignmentContent,
      [ExportEntityType.PREREQUISITE]: Prisma.ModelName.Prerequisite,
      [ExportEntityType.RESOURCE]: Prisma.ModelName.Resource,
      [ExportEntityType.SUPPORTED_LANGUAGE]: Prisma.ModelName.SupportedLanguage,
    };

    return mapping[entityType];
  }

  /**
   * Export data by entity type
   */
  async export(entityType: ExportEntityType, tenantId: string): Promise<string> {
    const modelName = this.getModelName(entityType);
    if (!modelName) {
      throw new BadRequestException(`Unsupported export entity type: ${entityType}`);
    }

    // Dynamic Prisma Access
    // We navigate to the correct model property which is camelCase
    const modelPropertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const model = (this.prisma as any)[modelPropertyName];
    if (!model) {
      throw new Error(`Prisma model ${modelName} not found`);
    }

    const filter: any = {};

    // Most models have tenantId, but check if it's applicable?
    // For raw export we usually filter by tenantId if the model has it.
    // We can check if the strategy has 'tenant_id' in its fields or just try-catch?
    // Or strictly rely on specific logic.
    // The previous implementation for raw export did: if (tenantId) filter.tenantId = tenantId;
    // And for most types it applied it.
    // Let's assume safely that if we pass tenantId, we want to filter by it.
    // However, some global tables like SupportedLanguage might not have tenantId.

    // Special handling for shared tables or those without tenantId
    if (entityType !== ExportEntityType.SUPPORTED_LANGUAGE) {
      filter.tenantId = tenantId;
    }

    // Add deletedAt check if applicable
    // We can check if the model has soft delete by convention or just apply it and see?
    // Better to apply it. If the column doesn't exist, Prisma might complain if we aren't careful.
    // But since we are using weak typing (any), we need to be sure.
    // For now, let's assume all our exportable entities support soft delete except maybe supportedLanguage?
    if (entityType !== ExportEntityType.SUPPORTED_LANGUAGE) {
      filter.deletedAt = null;
    }

    // Sort by createdAt if possible, or id
    const orderBy = { createdAt: 'asc' }; // Most have createdAt
    // SupportedLanguage has code
    const actualOrderBy =
      entityType === ExportEntityType.SUPPORTED_LANGUAGE ? { code: 'asc' } : orderBy;

    const data = await model.findMany({
      where: filter,
      orderBy: actualOrderBy,
    });

    if (!data || data.length === 0) {
      throw new I18nNotFoundException('messages.dataTransfer.noData');
    }

    // Determine ImportEntityType for strategy lookup to get headers
    // Convention: ExportEntityType + '_raw' = ImportEntityType (mostly)
    // e.g. 'course' -> 'course_raw'
    // 'supported_language' -> 'supported_language_raw'
    const importEntityType = `${entityType}_raw`;

    // Attempt to find strategy configuration to map fields
    const strategy = this.rawStrategyMap.get(importEntityType);
    let fieldMapping: { prismaField: string; csvHeader: string }[] | null = null;

    if (strategy) {
      const config = (strategy as any).getConfig();
      if (config && config.fields) {
        fieldMapping = config.fields.map((f: any) => ({
          prismaField: f.prismaField,
          csvHeader: f.name,
        }));
      }
    }

    // Serialize and Map records
    const serializedRecords = (data as Record<string, unknown>[]).map((record) => {
      const serialized: Record<string, string> = {};

      if (fieldMapping) {
        // Use mapping from strategy
        for (const mapping of fieldMapping) {
          const value = record[mapping.prismaField];
          serialized[mapping.csvHeader] = this.serializeValue(value);
        }
      } else {
        // Fallback to default behavior (camelCase keys)
        for (const [key, value] of Object.entries(record)) {
          serialized[key] = this.serializeValue(value);
        }
      }
      return serialized;
    });

    return this.csvParser.generateCsv(serializedRecords);
  }

  /**
   * Get the filename for export
   */
  getExportFilename(entityType: ExportEntityType): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${entityType}-export-${timestamp}.csv`;
  }

  private serializeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    } else if (value instanceof Date) {
      return value.toISOString();
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else if (Array.isArray(value)) {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  }
}
