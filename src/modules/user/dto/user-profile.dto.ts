import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum UserProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
}

export class AddressDto {
  @ApiProperty({ description: 'Street Address', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  street: LocalizedStringDto;

  @ApiProperty({ description: 'City', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  city: LocalizedStringDto;

  @ApiPropertyOptional({ description: 'State/Province', type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  state?: LocalizedStringDto;

  @ApiProperty({ description: 'Postal Code', example: '12345' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  country: LocalizedStringDto;
}

export class GuardianDto {
  @ApiProperty({ description: 'First Name', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  firstName: LocalizedStringDto;

  @ApiProperty({ description: 'Last Name', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  lastName: LocalizedStringDto;

  @ApiProperty({ description: 'Relationship to applicant', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  relationship: LocalizedStringDto;

  @ApiProperty({ description: 'Phone Number', example: '+966500000000' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email Address', example: 'guardian@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Profession', type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  profession?: LocalizedStringDto;
}

export class EducationDto {
  @ApiProperty({ description: 'Previous School Name', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  previousSchool: LocalizedStringDto;

  @ApiProperty({ description: 'Last Grade Completed', type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  lastGradeCompleted: LocalizedStringDto;

  @ApiProperty({ description: 'Year of Completion', example: 2024 })
  @IsNotEmpty()
  @IsNumber()
  yearOfCompletion: number;

  @ApiPropertyOptional({ description: 'Percentage / Grade / GPA', example: 95 })
  @IsOptional()
  @IsNumber()
  percentage?: number;
}

export class CreateUserProfileDto {
  @ApiPropertyOptional({ description: 'User ID (if not provided, uses current user)', example: 'USR-123e4567-e89b-12d3' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Date of Birth', example: '2010-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Nationality', example: 'Saudi' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'National ID / Iqama', example: '1000000000' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Passport Number', example: 'A12345678' })
  @IsOptional()
  @IsString()
  passportNo?: string;

  @ApiPropertyOptional({ description: 'Status', enum: UserProfileStatus, example: UserProfileStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserProfileStatus)
  status?: UserProfileStatus;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Guardian Information', type: GuardianDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian?: GuardianDto;

  @ApiPropertyOptional({ description: 'Education Details', type: [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'Date of Birth', example: '2010-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Nationality', example: 'Saudi' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'National ID / Iqama', example: '1000000000' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Passport Number', example: 'A12345678' })
  @IsOptional()
  @IsString()
  passportNo?: string;

  @ApiPropertyOptional({ description: 'Status', enum: UserProfileStatus, example: UserProfileStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserProfileStatus)
  status?: UserProfileStatus;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Guardian Information', type: GuardianDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian?: GuardianDto;

  @ApiPropertyOptional({ description: 'Education Details', type: [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];
}

export class FilterUserProfileDto {
  @ApiPropertyOptional({ description: 'Search term (searches in nationality, nationalId, passportNo)', example: 'Saudi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Filter by nationality', example: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID', example: 'USR-123e4567' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserProfileStatus, example: UserProfileStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserProfileStatus)
  status?: UserProfileStatus;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'dateOfBirth'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

