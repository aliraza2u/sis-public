import { IsNotEmpty, MinLength, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-123', description: 'Password reset token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 number and be at least 8 characters long',
  })
  newPassword: string;
}
