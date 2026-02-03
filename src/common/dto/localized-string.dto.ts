import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LocalizedStringDto {
  @ApiProperty({ description: 'English text', example: 'Engineer' })
  @IsNotEmpty()
  @IsString()
  en: string;

  @ApiProperty({ description: 'Arabic text', required: false, example: 'مهندس' })
  @IsOptional()
  @IsString()
  ar?: string;
}
