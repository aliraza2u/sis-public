import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { LocalizedStringDto } from '@/common/dto/localized-string.dto';
import { ApplicationStatus } from '@/common/enums';
import { ApplicationEntity } from '../entities/application.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ApplicationSortBy {
  CREATED_AT = 'createdAt',
  SUBMITTED_AT = 'submittedAt',
  APPLICATION_NUMBER = 'applicationNumber',
}

export class PersonalInfoDto {
  @ApiProperty({ description: 'Date of Birth', example: '2010-01-01' })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Nationality', example: 'Saudi' })
  @IsNotEmpty()
  @IsString()
  nationality: string;

  @ApiProperty({ description: 'National ID / Iqama', required: false, example: '1000000000' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ description: 'Passport Number', required: false, example: 'A12345678' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiProperty({ description: 'Address', required: false, type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  address?: LocalizedStringDto;
}

export class GuardianInfoDto {
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

  @ApiProperty({ description: 'Email Address', required: false, example: 'guardian@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Profession', required: false, type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  profession?: LocalizedStringDto;
}

export class EducationInfoDto {
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

  @ApiProperty({ description: 'Percentage / Grade / GPA', required: false, example: 95 })
  @IsOptional()
  @IsNumber()
  percentage?: number;
}

export class CreateApplicationDto {
  @ApiProperty({ description: 'Personal Information', type: PersonalInfoDto })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;

  @ApiProperty({ description: 'Guardian Information', type: GuardianInfoDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GuardianInfoDto)
  guardianInfo?: GuardianInfoDto;

  @ApiProperty({ description: 'Education Information', type: [EducationInfoDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationInfoDto)
  educationInfo?: EducationInfoDto[];
}

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'New status for the application',
    enum: ApplicationStatus,
    enumName: 'ApplicationStatus',
    example: ApplicationStatus.approved,
  })
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({
    description: 'Internal review notes (not visible to applicant)',
    required: false,
    example: 'Documents verified, applicant meets all criteria.',
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiProperty({
    description: 'Reason for rejection (localized, required if status is rejected)',
    required: false,
    type: LocalizedStringDto,
    example: { en: 'Incomplete documents', ar: 'مستندات غير مكتملة' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  rejectionReason?: LocalizedStringDto;
}

export class ApplicationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by Batch ID' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Application Number' })
  @IsOptional()
  @IsString()
  applicationNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by Roll Number' })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Search term for name, email or number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ApplicationSortBy,
    default: ApplicationSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ApplicationSortBy)
  sortBy?: ApplicationSortBy = ApplicationSortBy.CREATED_AT;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationEntity] })
  applications: ApplicationEntity[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
