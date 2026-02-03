import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '@/infrastructure/prisma/client/client';

export class TenantEntity implements Tenant {
  @ApiProperty({ example: '1a16ecb2-c550-491b-9cdd-9e0a61f9cb83' })
  id: string;

  @ApiProperty({ example: { en: 'Tech Corp' } })
  name: any;

  @ApiProperty({ example: 'tech-corp' })
  slug: string;

  @ApiProperty({ example: 'TC', required: false, nullable: true })
  alias: string | null;

  @ApiProperty({ required: false, nullable: true })
  logoUrl: string | null;

  @ApiProperty({ example: '#1B4F72' })
  primaryColor: string | null;

  @ApiProperty({ example: '#2E86AB' })
  secondaryColor: string | null;

  @ApiProperty({ example: 'contact@example.com' })
  contactEmail: string;

  @ApiProperty({ required: false, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ required: false })
  address: any;

  @ApiProperty({ required: false, nullable: true })
  website: string | null;

  @ApiProperty({ example: 'ar' })
  defaultLanguageCode: string | null;

  @ApiProperty({ example: ['en', 'ar'] })
  enabledLanguages: string[];

  @ApiProperty({ example: 'Asia/Riyadh' })
  timezone: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  settings: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ required: false, nullable: true })
  updatedBy: string | null;

  @ApiProperty({ required: false, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  deletedBy: string | null;
}
