import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CheckEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class RequestSetupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class SetupPasswordDto {
  @ApiProperty({ example: 'setup-token-abc' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
