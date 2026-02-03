import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/infrastructure/prisma/client/client';
import { Exclude } from 'class-transformer';
import { TenantEntity } from './tenant.entity';

export class UserEntity implements User {
  @ApiProperty({ example: '56d259ae-179d-464e-9d3c-b28da6055b85' })
  id: string;

  @ApiProperty({ example: '1a16ecb2-c550-491b-9cdd-9e0a61f9cb83' })
  tenantId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @Exclude()
  passwordHash: string;

  @ApiProperty({ example: { en: 'John' } })
  firstName: any;

  @ApiProperty({ example: { en: 'Doe' } })
  lastName: any;

  @ApiProperty({ example: '+1234567890', required: false, nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'applicant', enum: ['applicant', 'reviewer', 'admin', 'super_admin'] })
  role: 'applicant' | 'reviewer' | 'admin' | 'super_admin';

  @ApiProperty({ required: false, nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ required: false, nullable: true })
  emailVerifiedAt: Date | null;

  @Exclude()
  verificationToken: string | null;

  @Exclude()
  verificationTokenExpires: Date | null;

  @Exclude()
  passwordResetToken: string | null;

  @Exclude()
  passwordResetExpires: Date | null;

  @ApiProperty({ example: 'en' })
  preferredLanguageCode: string | null;

  @ApiProperty({ required: false, nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => TenantEntity, required: false })
  tenant?: TenantEntity;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ required: false, nullable: true })
  updatedBy: string | null;

  @Exclude()
  deletedAt: Date | null;

  @Exclude()
  deletedBy: string | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
