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
export class TenantRawImportStrategy implements RawImportStrategy {
  private readonly logger = new Logger(TenantRawImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return ImportEntityType.TENANT_RAW;
  }

  getDependencyOrder(): number {
    return 0; // No dependencies
  }

  isRawImport(): boolean {
    return true;
  }

  getExpectedHeaders(): string[] {
    return [
      'id',
      'name',
      'slug',
      'alias',
      'logo_url',
      'primary_color',
      'secondary_color',
      'contact_email',
      'contact_phone',
      'address',
      'website',
      'default_language',
      'enabled_languages',
      'timezone',
      'is_active',
      'settings',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
    ];
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'TNT_abc123',
      name: '{"en":"My Org","ar":"منظمتي"}',
      slug: 'my-org',
      alias: 'MO',
      contact_email: 'contact@example.com',
      is_active: 'true',
    };
  }

  async validate(row: Record<string, unknown>, rowIndex: number): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const normalizedData: Record<string, unknown> = {};

    // Required: id
    const id = RawValueParser.parseString(row['id']);
    if (!id) {
      errors.push({ field: 'id', message: 'ID is required' });
    } else {
      normalizedData['id'] = id;
    }

    // Required: name (JSON)
    const name = RawValueParser.parseJson(row['name']);
    if (!name) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else {
      normalizedData['name'] = name;
    }

    // Required: slug
    const slug = RawValueParser.parseString(row['slug']);
    if (!slug) {
      errors.push({ field: 'slug', message: 'Slug is required' });
    } else {
      normalizedData['slug'] = slug;
    }

    // Required: contact_email
    const contactEmail = RawValueParser.parseString(row['contact_email']);
    if (!contactEmail) {
      errors.push({ field: 'contact_email', message: 'Contact email is required' });
    } else {
      normalizedData['contact_email'] = contactEmail;
    }

    // Optional fields
    normalizedData['alias'] = RawValueParser.parseString(row['alias']);
    normalizedData['logo_url'] = RawValueParser.parseString(row['logo_url']);
    normalizedData['primary_color'] = RawValueParser.parseString(row['primary_color']);
    normalizedData['secondary_color'] = RawValueParser.parseString(row['secondary_color']);
    normalizedData['contact_phone'] = RawValueParser.parseString(row['contact_phone']);
    normalizedData['address'] = RawValueParser.parseJson(row['address']);
    normalizedData['website'] = RawValueParser.parseString(row['website']);
    normalizedData['default_language'] = RawValueParser.parseString(row['default_language']);
    normalizedData['enabled_languages'] = RawValueParser.parseArray(row['enabled_languages']) || [
      'en',
      'ar',
    ];
    normalizedData['timezone'] = RawValueParser.parseString(row['timezone']);
    normalizedData['is_active'] = RawValueParser.parseBoolean(row['is_active'] ?? true);
    normalizedData['settings'] = RawValueParser.parseJson(row['settings']);
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

  async importBatch(
    rows: ValidatedRow[],
    _tenantId: string, // Not used for tenant imports
  ): Promise<BatchImportResult> {
    let successCount = 0;
    const errors: ImportError[] = [];

    for (const row of rows) {
      try {
        const data = row.data;

        // Atomic upsert: update if exists, create if not
        await this.prisma.tenant.upsert({
          where: { id: data['id'] as string },
          update: {
            name: data['name'] as object,
            slug: data['slug'] as string,
            alias: data['alias'] as string | null,
            logoUrl: data['logo_url'] as string | null,
            primaryColor: data['primary_color'] as string | null,
            secondaryColor: data['secondary_color'] as string | null,
            contactEmail: data['contact_email'] as string,
            contactPhone: data['contact_phone'] as string | null,
            address: data['address'] || undefined,
            website: data['website'] as string | null,
            defaultLanguageCode: data['default_language'] as string | null,
            enabledLanguages: data['enabled_languages'] as string[],
            timezone: data['timezone'] as string | null,
            isActive: data['is_active'] as boolean,
            settings: data['settings'] || undefined,
            updatedAt: (data['updated_at'] as Date) || new Date(),
            updatedBy: data['updated_by'] as string | null,
          },
          create: {
            id: data['id'] as string,
            name: data['name'] as object,
            slug: data['slug'] as string,
            alias: data['alias'] as string | null,
            logoUrl: data['logo_url'] as string | null,
            primaryColor: data['primary_color'] as string | null,
            secondaryColor: data['secondary_color'] as string | null,
            contactEmail: data['contact_email'] as string,
            contactPhone: data['contact_phone'] as string | null,
            address: data['address'] || undefined,
            website: data['website'] as string | null,
            defaultLanguageCode: data['default_language'] as string | null,
            enabledLanguages: data['enabled_languages'] as string[],
            timezone: data['timezone'] as string | null,
            isActive: data['is_active'] as boolean,
            settings: data['settings'] || undefined,
            createdAt: (data['created_at'] as Date) || new Date(),
            updatedAt: (data['updated_at'] as Date) || new Date(),
            createdBy: data['created_by'] as string | null,
            updatedBy: data['updated_by'] as string | null,
          },
        });

        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import tenant row ${row.rowIndex}:`, error);
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
