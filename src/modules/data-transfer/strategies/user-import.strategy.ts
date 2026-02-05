import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  ImportStrategy,
  ValidationResult,
  ValidatedRow,
  BatchImportResult,
  ImportError,
} from './import-strategy.interface';
import { UserRole } from '@/infrastructure/prisma/client/client';

@Injectable()
export class UserImportStrategy implements ImportStrategy {
  private readonly logger = new Logger(UserImportStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  getEntityType(): string {
    return 'user';
  }

  getExpectedHeaders(): string[] {
    return ['email', 'firstName', 'lastName', 'role', 'phone'];
  }

  getSampleRow(): Record<string, string> {
    return {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'applicant',
      phone: '+1234567890',
    };
  }

  async validate(
    row: Record<string, unknown>,
    rowIndex: number,
    existingEmails?: Set<string>,
  ): Promise<ValidationResult> {
    const errors: { field: string; message: string }[] = [];
    const email = String(row.email || '')
      .toLowerCase()
      .trim();
    const firstName = String(row.firstName || '').trim();
    const lastName = String(row.lastName || '').trim();
    const role = String(row.role || '')
      .toLowerCase()
      .trim();
    const phone = row.phone ? String(row.phone).trim() : null;

    // Required field checks
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
      // Check for duplicates in current batch
      if (existingEmails?.has(email)) {
        errors.push({ field: 'email', message: 'Duplicate email in CSV file' });
      }
    }

    if (!firstName) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!lastName) {
      errors.push({ field: 'lastName', message: 'Last name is required' });
    }

    // Role validation
    const validRoles = Object.values(UserRole);
    if (!role) {
      errors.push({ field: 'role', message: 'Role is required' });
    } else if (!validRoles.includes(role as UserRole)) {
      errors.push({
        field: 'role',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      normalizedData: {
        email,
        firstName: { en: firstName },
        lastName: { en: lastName },
        role: role as UserRole,
        phone,
      },
    };
  }

  async importBatch(rows: ValidatedRow[], tenantId: string): Promise<BatchImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Get existing emails for this tenant to check uniqueness
    const emails = rows.map((r) => String(r.data.email));
    const existingUsers = await this.prisma.user.findMany({
      where: {
        tenantId,
        email: { in: emails },
      },
      select: { email: true },
    });
    const existingEmailSet = new Set(existingUsers.map((u) => u.email));

    // Process each row
    for (const row of rows) {
      const email = String(row.data.email);

      // Check if email already exists in database
      if (existingEmailSet.has(email)) {
        errors.push({
          row: row.rowIndex,
          field: 'email',
          message: 'Email already exists in this tenant',
          data: row.data,
        });
        continue;
      }

      try {
        await this.prisma.user.create({
          data: {
            tenantId,
            email,
            firstName: row.data.firstName as object,
            lastName: row.data.lastName as object,
            passwordHash: null, // Password will be set via Setup Password email workflow
            role: row.data.role as UserRole,
            phone: row.data.phone as string | null,
            emailVerified: false,
            isActive: true,
          },
        });

        successCount++;
        existingEmailSet.add(email); // Prevent duplicates within same batch
      } catch (error) {
        this.logger.error(`Failed to import user row ${row.rowIndex}:`, error);
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
