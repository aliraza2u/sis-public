import { Logger } from '@nestjs/common';
import { t_ } from '@/common/helpers/i18n.helper';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { FieldType } from '@/common/enums/field-type.enum';
import {
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';
import { RawImportStrategy, RawValueParser } from './raw-import-strategy.interface';

/**
 * Field configuration for auto-validation and upsert
 */
export interface FieldConfig {
  name: string;
  prismaField: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: unknown;
  mapper?: Record<string, unknown>;
}

export interface StrategyConfig {
  entityType: string;
  dependencyOrder: number;
  prismaModel: string; // e.g., 'tenant', 'lessonContent'
  fields: FieldConfig[];
  foreignKeyFields?: string[]; // For FK violation detection
  primaryKeyField?: string; // Custom PK field (default: 'id')
}

export abstract class BaseRawImportStrategy implements RawImportStrategy {
  protected readonly logger: Logger;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  protected abstract getConfig(): StrategyConfig;

  abstract getSampleRow(): Record<string, string>;

  getEntityType(): string {
    return this.getConfig().entityType;
  }

  getDependencyOrder(): number {
    return this.getConfig().dependencyOrder;
  }

  isRawImport(): boolean {
    return true;
  }

  /**
   * Auto-generate headers from field configuration
   */
  getExpectedHeaders(): string[] {
    return this.getConfig().fields.map((f) => f.name);
  }

  /**
   * Generic validation using field configuration
   */
  async validate(row: Record<string, unknown>, rowIndex: number): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const normalizedData: Record<string, unknown> = {};
    const config = this.getConfig();

    for (const field of config.fields) {
      const parser = this.getParser(field.type);
      const value = parser(row[field.name]);

      if (field.required) {
        if (value === null || value === undefined || value === '') {
          errors.push({
            field: field.name,
            message: `${field.name} is required`,
          });
        } else {
          normalizedData[field.name] = value;
        }
      } else {
        normalizedData[field.name] = value ?? field.defaultValue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData: errors.length === 0 ? normalizedData : undefined,
    };
  }

  /**
   * Generic import batch using dynamic Prisma access
   */
  async importBatch(rows: ValidatedRow[], _tenantId: string): Promise<BatchImportResult> {
    let successCount = 0;
    const errors: ImportError[] = [];
    const config = this.getConfig();

    for (const row of rows) {
      try {
        const data = row.data;
        const upsertData = this.buildUpsertData(data, config.fields);

        // Dynamic Prisma model access
        const model = (this.prisma as any)[config.prismaModel];
        if (!model) {
          throw new Error(`Prisma model '${config.prismaModel}' not found`);
        }

        // Find the prisma field name for the primary key
        const pkField = config.primaryKeyField || 'id';
        const pkFieldConfig = config.fields.find((f) => f.name === pkField);
        const pkPrismaField = pkFieldConfig?.prismaField || 'id';

        await model.upsert({
          where: { [pkPrismaField]: upsertData.id },
          update: upsertData.update,
          create: upsertData.create,
        });

        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import ${config.entityType} row ${row.rowIndex}:`, error);

        const isFKViolation = this.isForeignKeyViolation(error, config.foreignKeyFields);
        const isUniqueViolation = this.isUniqueConstraintViolation(error);

        let message = error instanceof Error ? error.message : 'Unknown error';
        let field = 'unknown';

        if (isFKViolation) {
          field = this.detectFKField(error, config.foreignKeyFields) || 'unknown';
          message = t_('messages.prisma.foreignKeyConstraint', { field });
        } else if (isUniqueViolation) {
          field = this.detectUniqueField(error) || 'unknown';
          message = t_('messages.prisma.uniqueConstraint', { field });
        }

        errors.push({
          row: row.rowIndex,
          field: field,
          message: message,
          data: row.data,
        });
      }
    }

    return { successCount, errors };
  }

  /**
   * Build upsert data from normalized row and field config
   */
  protected buildUpsertData(
    data: Record<string, unknown>,
    fields: FieldConfig[],
  ): { id: string; update: Record<string, unknown>; create: Record<string, unknown> } {
    const update: Record<string, unknown> = {};
    const create: Record<string, unknown> = {};
    const config = this.getConfig();
    const pkField = config.primaryKeyField || 'id';
    let id: string | undefined;

    for (const field of fields) {
      const value = data[field.name];
      const prismaValue = this.convertToPrismaValue(value, field);

      if (field.name === pkField) {
        id = value as string;
        create[field.prismaField] = prismaValue;
        // Primary key is not updated
      } else if (field.name === 'created_at' || field.name === 'created_by') {
        // Only set on create
        create[field.prismaField] =
          prismaValue ?? (field.name === 'created_at' ? new Date() : null);
      } else if (field.name === 'updated_at') {
        // Set on both update and create
        const dateValue = (prismaValue as Date) || new Date();
        update[field.prismaField] = dateValue;
        create[field.prismaField] = dateValue;
      } else {
        // Set on both update and create
        update[field.prismaField] = prismaValue;
        create[field.prismaField] = prismaValue;
      }
    }

    if (!id) {
      throw new Error(`Primary key field '${pkField}' is required for upsert`);
    }

    return { id, update, create };
  }

  /**
   * Convert normalized value to Prisma-compatible value
   */
  protected convertToPrismaValue(value: unknown, field: FieldConfig): unknown {
    if (value === null || value === undefined) {
      return field.type === FieldType.JSON ? undefined : null;
    }

    // JSON fields: use 'undefined' for empty to preserve Prisma defaults
    if (field.type === FieldType.JSON && !value) {
      return undefined;
    }

    // Apply mapper if available
    if (field.mapper) {
      if (Array.isArray(value)) {
        // Map each element and deduplicate
        const mappedArray = value.map((v) => (field.mapper![String(v)] as any) ?? v);
        return [...new Set(mappedArray)];
      }
      return (field.mapper[String(value)] as any) ?? value;
    }

    return value;
  }

  /**
   * Get parser function for field type
   */
  protected getParser(type: FieldConfig['type']): (value: unknown) => unknown {
    switch (type) {
      case FieldType.STRING:
        return RawValueParser.parseString;
      case FieldType.JSON:
        return RawValueParser.parseJson;
      case FieldType.DATE:
        return RawValueParser.parseDate;
      case FieldType.BOOLEAN:
        return RawValueParser.parseBoolean;
      case FieldType.NUMBER:
        return RawValueParser.parseNumber;
      case FieldType.ARRAY:
        return RawValueParser.parseArray;
      default:
        return RawValueParser.parseString;
    }
  }

  /**
   * Check if error is a foreign key violation
   */
  protected isForeignKeyViolation(error: unknown, foreignKeyFields?: string[]): boolean {
    if ((error as any)?.code === 'P2003') return true;
    if (!(error instanceof Error)) return false;

    const msg = error.message.toLowerCase();
    const isFKError =
      msg.includes('foreign key constraint') || msg.includes('foreign key') || msg.includes('fk_');

    if (!isFKError) return false;
    if (!foreignKeyFields || foreignKeyFields.length === 0) return true;

    // Check if any FK field is mentioned in error
    return foreignKeyFields.some((field) => msg.includes(field));
  }

  /**
   * Detect which FK field caused the violation
   */
  protected detectFKField(error: unknown, foreignKeyFields?: string[]): string | null {
    const meta = (error as any)?.meta;
    if (meta?.field_name) {
      // Prisma error output usually includes field_name in meta
      return meta.field_name;
    }

    if (!(error instanceof Error) || !foreignKeyFields) return null;

    const msg = error.message.toLowerCase();
    for (const field of foreignKeyFields) {
      if (msg.includes(field)) {
        return field;
      }
    }

    return foreignKeyFields.length > 0 ? foreignKeyFields[0] : null;
  }

  /**
   * Check if error is a unique constraint violation
   */
  protected isUniqueConstraintViolation(error: unknown): boolean {
    if ((error as any)?.code === 'P2002') return true;
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('unique constraint');
  }

  /**
   * Detect which field caused the unique constraint violation
   */
  protected detectUniqueField(error: unknown): string | null {
    const meta = (error as any)?.meta;
    if (meta && meta.target) {
      return Array.isArray(meta.target) ? meta.target.join(', ') : meta.target;
    }
    return null;
  }
}
