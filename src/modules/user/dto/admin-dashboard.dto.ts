import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardStatsDto {
  @ApiProperty({ example: 156 })
  totalUsers: number;

  @ApiProperty({ example: 24 })
  totalCourses: number;

  @ApiProperty({ description: 'Total import jobs for this tenant', example: 12 })
  totalImportJobs: number;

  @ApiProperty({
    description: 'Users who logged in within the last 30 days',
    example: 43,
  })
  activeUsersLast30Days: number;

  @ApiProperty({
    description: 'Users with isActive true (non-deleted)',
    example: 120,
  })
  activeAccounts: number;
}
