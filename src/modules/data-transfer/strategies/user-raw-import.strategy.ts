import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class UserRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.USER,
      dependencyOrder: 1,
      prismaModel: 'user',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'email', prismaField: 'email', type: 'string', required: true },
        { name: 'firstName', prismaField: 'firstName', type: 'json', required: true },
        { name: 'lastName', prismaField: 'lastName', type: 'json', required: true },
        { name: 'role', prismaField: 'role', type: 'string', required: true }, // Auto-validated if valid string? or we might need enum validation. Base class doesn't do enum validation by default unless type is enum? Base class only supports 'string', 'json', etc. We might need to override validate or just accept string and let prisma fail? Or better: add enum validator to base? For now assume strict string.
        { name: 'passwordHash', prismaField: 'passwordHash', type: 'string' },
        { name: 'phone', prismaField: 'phone', type: 'string' },
        { name: 'avatarUrl', prismaField: 'avatarUrl', type: 'string' },
        {
          name: 'emailVerified',
          prismaField: 'emailVerified',
          type: 'boolean',
          defaultValue: false,
        },
        { name: 'emailVerifiedAt', prismaField: 'emailVerifiedAt', type: 'date' },
        { name: 'verificationToken', prismaField: 'verificationToken', type: 'string' },
        {
          name: 'verificationTokenExpires',
          prismaField: 'verificationTokenExpires',
          type: 'date',
        },
        { name: 'passwordResetToken', prismaField: 'passwordResetToken', type: 'string' },
        { name: 'passwordResetExpires', prismaField: 'passwordResetExpires', type: 'date' },
        { name: 'preferredLanguage', prismaField: 'preferredLanguageCode', type: 'string' },
        { name: 'lastLoginAt', prismaField: 'lastLoginAt', type: 'date' },
        { name: 'isActive', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
      ],
      foreignKeyFields: ['tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'USR_abc123',
      tenantId: 'TNT_xyz789',
      email: 'user@example.com',
      firstName: '{"en":"John","ar":"جون"}',
      lastName: '{"en":"Doe","ar":"دو"}',
      role: 'applicant',
      isActive: 'true',
    };
  }
}
