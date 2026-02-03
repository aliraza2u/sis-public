import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

import { LocalizedStringDto } from '@/common/dto/localized-string.dto';

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

  @ApiProperty({ description: 'Education Information', type: EducationInfoDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EducationInfoDto)
  educationInfo?: EducationInfoDto;
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ description: 'New Status', enum: ApplicationStatus, example: 'approved' })
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({
    description: 'Review Notes',
    required: false,
    example: 'Approved after verification',
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiProperty({ description: 'Rejection Reason JSON', required: false })
  @IsOptional()
  @IsObject()
  rejectionReason?: any;
}
