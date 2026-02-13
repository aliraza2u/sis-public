import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { UserRole } from '@/infrastructure/prisma/client/client';
import {
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';
import { RawImportStrategy, RawValueParser } from './raw-import-strategy.interface';

@Injectable()
export class UserRawImportStrategy implements RawImportStrategy {
  private readonly logger = new Logger(UserRawImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return ImportEntityType.USER_RAW;
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
      'email',
      'password_hash',
      'first_name',
      'last_name',
      'phone',
      'role',
      'avatar_url',
      'email_verified',
      'email_verified_at',
      'verification_token',
      'verification_token_expires',
      'password_reset_token',
      'password_reset_expires',
      'preferred_language',
      'last_login_at',
      'is_active',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
    ];
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'USR_abc123',
      tenant_id: 'TNT_xyz789',
      email: 'user@example.com',
      first_name: '{"en":"John","ar":"جون"}',
      last_name: '{"en":"Doe","ar":"دو"}',
      role: 'applicant',
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

    // Required: tenant_id
    const tenantId = RawValueParser.parseString(row['tenant_id']);
    if (!tenantId) {
      errors.push({ field: 'tenant_id', message: 'Tenant ID is required' });
    } else {
      normalizedData['tenant_id'] = tenantId;
    }

    // Required: email
    const email = RawValueParser.parseString(row['email']);
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      normalizedData['email'] = email;
    }

    // Required: first_name (JSON)
    const firstName = RawValueParser.parseJson(row['first_name']);
    if (!firstName) {
      errors.push({ field: 'first_name', message: 'First name is required' });
    } else {
      normalizedData['first_name'] = firstName;
    }

    // Required: last_name (JSON)
    const lastName = RawValueParser.parseJson(row['last_name']);
    if (!lastName) {
      errors.push({ field: 'last_name', message: 'Last name is required' });
    } else {
      normalizedData['last_name'] = lastName;
    }

    // Required: role
    const role = RawValueParser.parseString(row['role']);
    if (!role) {
      errors.push({ field: 'role', message: 'Role is required' });
    } else if (!Object.values(UserRole).includes(role as UserRole)) {
      errors.push({ field: 'role', message: `Invalid role: ${role}` });
    } else {
      normalizedData['role'] = role;
    }

    // Optional fields
    normalizedData['password_hash'] = RawValueParser.parseString(row['password_hash']);
    normalizedData['phone'] = RawValueParser.parseString(row['phone']);
    normalizedData['avatar_url'] = RawValueParser.parseString(row['avatar_url']);
    normalizedData['email_verified'] = RawValueParser.parseBoolean(row['email_verified'] ?? false);
    normalizedData['email_verified_at'] = RawValueParser.parseDate(row['email_verified_at']);
    normalizedData['verification_token'] = RawValueParser.parseString(row['verification_token']);
    normalizedData['verification_token_expires'] = RawValueParser.parseDate(
      row['verification_token_expires'],
    );
    normalizedData['password_reset_token'] = RawValueParser.parseString(
      row['password_reset_token'],
    );
    normalizedData['password_reset_expires'] = RawValueParser.parseDate(
      row['password_reset_expires'],
    );
    normalizedData['preferred_language'] = RawValueParser.parseString(row['preferred_language']);
    normalizedData['last_login_at'] = RawValueParser.parseDate(row['last_login_at']);
    normalizedData['is_active'] = RawValueParser.parseBoolean(row['is_active'] ?? true);
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
    _tenantId: string, // Not used, tenant_id comes from CSV
  ): Promise<BatchImportResult> {
    let successCount = 0;
    const errors: ImportError[] = [];

    for (const row of rows) {
      try {
        const data = row.data;

        // Atomic upsert: update if exists, create if not
        await this.prisma.user.upsert({
          where: { id: data['id'] as string },
          update: {
            tenantId: data['tenant_id'] as string,
            email: data['email'] as string,
            passwordHash: (data['password_hash'] as string) || '',
            firstName: data['first_name'] as object,
            lastName: data['last_name'] as object,
            phone: data['phone'] as string | null,
            role: data['role'] as UserRole,
            avatarUrl: data['avatar_url'] as string | null,
            emailVerified: data['email_verified'] as boolean,
            emailVerifiedAt: data['email_verified_at'] as Date | null,
            verificationToken: data['verification_token'] as string | null,
            verificationTokenExpires: data['verification_token_expires'] as Date | null,
            passwordResetToken: data['password_reset_token'] as string | null,
            passwordResetExpires: data['password_reset_expires'] as Date | null,
            preferredLanguageCode: data['preferred_language'] as string | null,
            lastLoginAt: data['last_login_at'] as Date | null,
            isActive: data['is_active'] as boolean,
            updatedAt: (data['updated_at'] as Date) || new Date(),
            updatedBy: data['updated_by'] as string | null,
          },
          create: {
            id: data['id'] as string,
            tenantId: data['tenant_id'] as string,
            email: data['email'] as string,
            passwordHash: (data['password_hash'] as string) || '',
            firstName: data['first_name'] as object,
            lastName: data['last_name'] as object,
            phone: data['phone'] as string | null,
            role: data['role'] as UserRole,
            avatarUrl: data['avatar_url'] as string | null,
            emailVerified: data['email_verified'] as boolean,
            emailVerifiedAt: data['email_verified_at'] as Date | null,
            verificationToken: data['verification_token'] as string | null,
            verificationTokenExpires: data['verification_token_expires'] as Date | null,
            passwordResetToken: data['password_reset_token'] as string | null,
            passwordResetExpires: data['password_reset_expires'] as Date | null,
            preferredLanguageCode: data['preferred_language'] as string | null,
            lastLoginAt: data['last_login_at'] as Date | null,
            isActive: data['is_active'] as boolean,
            createdAt: (data['created_at'] as Date) || new Date(),
            updatedAt: (data['updated_at'] as Date) || new Date(),
            createdBy: data['created_by'] as string | null,
            updatedBy: data['updated_by'] as string | null,
          },
        });

        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import user row ${row.rowIndex}:`, error);

        // Check if it's a FK violation
        const isFKViolation =
          error instanceof Error &&
          (error.message.includes('Foreign key constraint') || error.message.includes('tenant_id'));

        errors.push({
          row: row.rowIndex,
          field: isFKViolation ? 'tenant_id' : 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row.data,
        });
      }
    }

    return { successCount, errors };
  }
}
