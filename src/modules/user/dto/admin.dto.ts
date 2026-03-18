import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDefined, ValidateNested, IsBoolean, IsEnum, IsIn, IsInt, Min } from 'class-validator';
import { UserRole } from '@/common/enums';
import { Type, Transform } from 'class-transformer';

export class AdminNameDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'جون' })
  @IsString()
  @IsNotEmpty()
  ar: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: AdminNameDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => AdminNameDto)
  firstName: AdminNameDto;

  @ApiProperty({ type: AdminNameDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => AdminNameDto)
  lastName: AdminNameDto;

  @ApiProperty({ enum: [UserRole.admin], example: UserRole.admin })
  @IsIn([UserRole.admin])
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'en', required: false })
  @IsString()
  @IsOptional()
  preferredLanguageCode?: string;
}

export class UpdateAdminDto extends PartialType(CreateAdminDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FilterAdminDto {
  @ApiProperty({ required: false, description: 'Search term for name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
