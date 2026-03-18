import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserPublicDto } from './user-public.dto';
import {
  StudentOverviewSummaryDto,
  StudentOverviewEnrollmentDto,
} from '@/modules/grades/dto/student-overview.dto';
import { Gender, UserProfileStatus } from '@/infrastructure/prisma/client/client';
import { Gender as GenderDto, UserProfileStatus as UserProfileStatusDto } from './user-profile.dto';

/** Profile row when it exists (no sensitive user duplication). */
export class UserProfileDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tenantId: string;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ enum: GenderDto, nullable: true })
  gender: Gender | null;

  @ApiPropertyOptional({ nullable: true })
  nationality: string | null;

  @ApiPropertyOptional({ nullable: true })
  nationalId: string | null;

  @ApiPropertyOptional({ nullable: true })
  passportNo: string | null;

  @ApiProperty({ enum: UserProfileStatusDto })
  status: UserProfileStatus;

  @ApiPropertyOptional()
  address: unknown;

  @ApiPropertyOptional()
  guardian: unknown;

  @ApiPropertyOptional()
  education: unknown;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserProfileDetailResponseDto {
  @ApiProperty({ type: UserPublicDto })
  user: UserPublicDto;

  @ApiPropertyOptional({
    type: UserProfileDataDto,
    nullable: true,
    description: 'Null when the user has not created a profile yet',
  })
  profile: UserProfileDataDto | null;

  @ApiPropertyOptional({ type: StudentOverviewSummaryDto })
  academicSummary?: StudentOverviewSummaryDto;

  @ApiPropertyOptional({ type: [StudentOverviewEnrollmentDto] })
  academicEnrollments?: StudentOverviewEnrollmentDto[];
}
