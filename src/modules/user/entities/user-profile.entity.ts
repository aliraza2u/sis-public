import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfile, Gender } from '@/infrastructure/prisma/client/client';
import { Exclude } from 'class-transformer';
import { Gender as GenderDto } from '../dto/user-profile.dto';

export class UserProfileEntity implements UserProfile {
  @ApiProperty({ example: 'UPF-123e4567-e89b-12d3' })
  id: string;

  @ApiProperty({ example: 'USR-123e4567-e89b-12d3' })
  userId: string;

  @ApiProperty({ example: 'TNT-123e4567-e89b-12d3' })
  tenantId: string;

  @ApiPropertyOptional({ description: 'Date of Birth', example: '1990-01-01' })
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ description: 'Gender', enum: GenderDto, example: GenderDto.MALE })
  gender: Gender | null;

  @ApiPropertyOptional({ description: 'Nationality', example: 'Saudi Arabia' })
  nationality: string | null;

  @ApiPropertyOptional({ description: 'National ID', example: '1234567890' })
  nationalId: string | null;

  @ApiPropertyOptional({ description: 'Passport Number', example: 'A12345678' })
  passportNo: string | null;

  @ApiPropertyOptional({
    description: 'Address (multilingual JSON object)',
    example: { en: { street: '123 Main St', city: 'Riyadh' }, ar: { street: 'شارع الرئيسي 123', city: 'الرياض' } },
  })
  address: any;

  @ApiPropertyOptional({
    description: 'Guardian Information (multilingual JSON object)',
    example: { en: { name: 'John Doe', relation: 'Father' }, ar: { name: 'جون دو', relation: 'أب' } },
  })
  guardian: any;

  @ApiPropertyOptional({
    description: 'Education Details (array of multilingual JSON objects)',
    example: [
      { en: { degree: 'Bachelor', institution: 'University' }, ar: { degree: 'بكالوريوس', institution: 'جامعة' } },
    ],
  })
  education: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;

  @Exclude()
  deletedBy: string | null;

  constructor(partial: Partial<UserProfileEntity>) {
    Object.assign(this, partial);
  }
}

