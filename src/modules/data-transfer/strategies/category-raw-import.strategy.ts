import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import {
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';
import { RawImportStrategy, RawValueParser } from './raw-import-strategy.interface';

@Injectable()
export class CategoryRawImportStrategy implements RawImportStrategy {
  private readonly logger = new Logger(CategoryRawImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return ImportEntityType.CATEGORY_RAW;
  }

  getDependencyOrder(): number {
    return 1; // Depends on Tenant
  }

  isRawImport(): boolean {
    return true;
  }

  getExpectedHeaders(): string[] {
    return [
      'id',
      'tenant_id',
      'name',
      'description',
      'slug',
      'is_active',
      'sort_order',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
    ];
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'CAT_abc123',
      tenant_id: 'TNT_xyz789',
      name: '{"en":"Technology","ar":"التكنولوجيا"}',
      slug: 'technology',
      is_active: 'true',
      sort_order: '0',
    };
  }

  async validate(row: Record<string, unknown>, rowIndex: number): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const normalizedData: Record<string, unknown> = {};

    // Required fields
    const id = RawValueParser.parseString(row['id']);
    if (!id) errors.push({ field: 'id', message: 'ID is required' });
    else normalizedData['id'] = id;

    const tenantId = RawValueParser.parseString(row['tenant_id']);
    if (!tenantId) errors.push({ field: 'tenant_id', message: 'Tenant ID is required' });
    else normalizedData['tenant_id'] = tenantId;

    const name = RawValueParser.parseJson(row['name']);
    if (!name) errors.push({ field: 'name', message: 'Name is required' });
    else normalizedData['name'] = name;

    const slug = RawValueParser.parseString(row['slug']);
    if (!slug) errors.push({ field: 'slug', message: 'Slug is required' });
    else normalizedData['slug'] = slug;

    // Optional fields
    normalizedData['description'] = RawValueParser.parseJson(row['description']);
    normalizedData['is_active'] = RawValueParser.parseBoolean(row['is_active'] ?? true);
    normalizedData['sort_order'] = RawValueParser.parseInt(row['sort_order']) ?? 0;
    normalizedData['created_at'] = RawValueParser.parseDate(row['created_at']);
    normalizedData['updated_at'] = RawValueParser.parseDate(row['updated_at']);
    normalizedData['created_by'] = RawValueParser.parseString(row['created_by']);
    normalizedData['updated_by'] = RawValueParser.parseString(row['updated_by']);

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData: errors.length === 0 ? normalizedData : undefined,
    };
  }

  async importBatch(rows: ValidatedRow[], _tenantId: string): Promise<BatchImportResult> {
    let successCount = 0;
    const errors: ImportError[] = [];

    for (const row of rows) {
      try {
        const data = row.data;

        await this.prisma.category.upsert({
          where: { id: data['id'] as string },
          update: {
            tenantId: data['tenant_id'] as string,
            name: data['name'] as object,
            description: data['description'] || undefined,
            slug: data['slug'] as string,
            isActive: data['is_active'] as boolean,
            sortOrder: data['sort_order'] as number,
            updatedAt: (data['updated_at'] as Date) || new Date(),
            updatedBy: data['updated_by'] as string | null,
          },
          create: {
            id: data['id'] as string,
            tenantId: data['tenant_id'] as string,
            name: data['name'] as object,
            description: data['description'] || undefined,
            slug: data['slug'] as string,
            isActive: data['is_active'] as boolean,
            sortOrder: data['sort_order'] as number,
            createdAt: (data['created_at'] as Date) || new Date(),
            updatedAt: (data['updated_at'] as Date) || new Date(),
            createdBy: data['created_by'] as string | null,
            updatedBy: data['updated_by'] as string | null,
          },
        });

        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import category row ${row.rowIndex}:`, error);
        errors.push({
          row: row.rowIndex,
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row.data,
        });
      }
    }

    return { successCount, errors };
  }
}
