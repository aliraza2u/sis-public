import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import {
  ImportStrategy,
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';

@Injectable()
export class ModuleItemProgressImportStrategy implements ImportStrategy {
  private readonly logger = new Logger(ModuleItemProgressImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return ImportEntityType.MODULE_ITEM_PROGRESS;
  }

  getExpectedHeaders(): string[] {
    return ['user_email', 'module_item_id', 'status', 'progress_percent', 'completed_at'];
  }

  getSampleRow(): Record<string, string> {
    return {
      user_email: 'student@example.com',
      module_item_id: 'uuid-of-module-item',
      status: 'completed',
      progress_percent: '100',
      completed_at: '2023-10-27T10:00:00Z',
    };
  }

  async validate(row: Record<string, unknown>, rowIndex: number): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const normalizedData: Record<string, unknown> = {};

    // Validate user_email
    if (!row['user_email'] || typeof row['user_email'] !== 'string') {
      errors.push({ field: 'user_email', message: 'User email is required' });
    } else {
      normalizedData['user_email'] = row['user_email'].trim().toLowerCase();
    }

    // Validate module_item_id
    if (!row['module_item_id'] || typeof row['module_item_id'] !== 'string') {
      errors.push({ field: 'module_item_id', message: 'Module Item ID is required' });
    } else {
      normalizedData['module_item_id'] = row['module_item_id'].trim();
    }

    // Validate status
    if (!row['status'] || typeof row['status'] !== 'string') {
      errors.push({ field: 'status', message: 'Status is required' });
    } else {
      normalizedData['status'] = row['status'].trim();
    }

    // Validate progress_percent
    const progress = Number(row['progress_percent']);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      // Optional: behave leniently or strictly. Let's error for now.
      // If undefined/null, existing logic `isNaN` catches it unless it's empty string -> 0
      if (row['progress_percent'] === undefined || row['progress_percent'] === '') {
        normalizedData['progress_percent'] = 0;
      } else {
        errors.push({
          field: 'progress_percent',
          message: 'Progress percent must be between 0 and 100',
        });
      }
    } else {
      normalizedData['progress_percent'] = progress;
    }

    // Validate completed_at
    if (row['completed_at']) {
      const completedAt = new Date(row['completed_at'] as string);
      if (isNaN(completedAt.getTime())) {
        errors.push({ field: 'completed_at', message: 'Invalid date format' });
      } else {
        normalizedData['completed_at'] = completedAt;
      }
    } else {
      normalizedData['completed_at'] = null;
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData: errors.length === 0 ? normalizedData : undefined,
    };
  }

  async importBatch(rows: ValidatedRow[], tenantId: string): Promise<BatchImportResult> {
    let successCount = 0;
    const errors: ImportError[] = [];

    // Pre-fetch users and module items to validate existence and get IDs
    const emails = rows.map((r) => r.data['user_email'] as string);
    const moduleItemIds = rows.map((r) => r.data['module_item_id'] as string);

    // Fetch users in this tenant
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        email: { in: emails },
      },
      select: { id: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.email, u.id]));

    // Fetch module items in this tenant
    const moduleItems = await this.prisma.moduleItem.findMany({
      where: {
        tenantId,
        id: { in: moduleItemIds },
      },
      select: { id: true },
    });
    const moduleItemSet = new Set(moduleItems.map((mi) => mi.id));

    for (const row of rows) {
      const { user_email, module_item_id, status, progress_percent, completed_at } = row.data;

      const userId = userMap.get(user_email as string);
      const isValidModuleItem = moduleItemSet.has(module_item_id as string);

      if (!userId) {
        errors.push({
          row: row.rowIndex,
          field: 'user_email',
          message: `User with email ${user_email} not found in this tenant`,
          data: row.data,
        });
        continue;
      }

      if (!isValidModuleItem) {
        errors.push({
          row: row.rowIndex,
          field: 'module_item_id',
          message: `Module Item with ID ${module_item_id} not found in this tenant`,
          data: row.data,
        });
        continue;
      }

      try {
        await this.prisma.moduleItemProgress.upsert({
          where: {
            userId_moduleItemId: {
              userId,
              moduleItemId: module_item_id as string,
            },
          },
          update: {
            status: status as string,
            progressPercent: progress_percent as number,
            completedAt: completed_at as Date | null,
            updatedBy: 'import',
          },
          create: {
            tenantId,
            userId,
            moduleItemId: module_item_id as string,
            status: status as string,
            progressPercent: progress_percent as number,
            completedAt: completed_at as Date | null,
            createdBy: 'import',
          },
        });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import row ${row.rowIndex}`, error);
        errors.push({
          row: row.rowIndex,
          field: 'unknown',
          message: 'Database error during upsert',
          data: row.data,
        });
      }
    }

    return { successCount, errors };
  }
}
