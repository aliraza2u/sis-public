import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  ImportStrategy,
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';

@Injectable()
export class TenantImportStrategy implements ImportStrategy {
  private readonly logger = new Logger(TenantImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return 'tenant';
  }

  getExpectedHeaders(): string[] {
    return ['name', 'slug', 'contactEmail', 'contactPhone', 'website'];
  }

  getSampleRow(): Record<string, string> {
    return {
      name: 'My Organization',
      slug: 'my-organization',
      contactEmail: 'contact@myorg.com',
      contactPhone: '+1234567890',
      website: 'https://myorg.com',
    };
  }

  async validate(
    row: Record<string, unknown>,
    rowIndex: number,
    existingSlugs?: Set<string>,
  ): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const name = String(row.name || '').trim();
    const slug = String(row.slug || '')
      .toLowerCase()
      .trim();
    const contactEmail = String(row.contactEmail || '')
      .toLowerCase()
      .trim();
    const contactPhone = row.contactPhone ? String(row.contactPhone).trim() : null;
    const website = row.website ? String(row.website).trim() : null;

    // Required field checks
    if (!name) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!slug) {
      errors.push({ field: 'slug', message: 'Slug is required' });
    } else {
      // Slug format validation: alphanumeric with hyphens only
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        errors.push({
          field: 'slug',
          message: 'Slug must be lowercase alphanumeric with hyphens only',
        });
      }
      // Check for duplicates in current batch
      if (existingSlugs?.has(slug)) {
        errors.push({ field: 'slug', message: 'Duplicate slug in CSV file' });
      }
    }

    if (!contactEmail) {
      errors.push({ field: 'contactEmail', message: 'Contact email is required' });
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        errors.push({ field: 'contactEmail', message: 'Invalid email format' });
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      normalizedData: {
        name: { en: name },
        slug,
        contactEmail,
        contactPhone,
        website,
      },
    };
  }

  async importBatch(
    rows: ValidatedRow[],
    _tenantId: string, // Not used for tenant imports
  ): Promise<BatchImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Get existing slugs to check uniqueness
    const slugs = rows.map((r) => String(r.data.slug));
    const existingTenants = await this.prisma.tenant.findMany({
      where: {
        slug: { in: slugs },
      },
      select: { slug: true },
    });
    const existingSlugSet = new Set(existingTenants.map((t) => t.slug));

    // Process each row
    for (const row of rows) {
      const slug = String(row.data.slug);

      // Check if slug already exists in database
      if (existingSlugSet.has(slug)) {
        errors.push({
          row: row.rowIndex,
          field: 'slug',
          message: 'Slug already exists',
          data: row.data,
        });
        continue;
      }

      try {
        await this.prisma.tenant.create({
          data: {
            name: row.data.name as object,
            slug,
            contactEmail: row.data.contactEmail as string,
            contactPhone: row.data.contactPhone as string | null,
            website: row.data.website as string | null,
            isActive: true,
          },
        });

        successCount++;
        existingSlugSet.add(slug); // Prevent duplicates within same batch
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
