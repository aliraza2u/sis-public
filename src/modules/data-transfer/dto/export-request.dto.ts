import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExportEntityType } from '@/common/enums/export-entity-type.enum';

export class ExportRequestDto {
  @ApiProperty({
    description: 'Type of entity to export',
    enum: ExportEntityType,
    example: ExportEntityType.USER,
  })
  @IsEnum(ExportEntityType)
  @IsNotEmpty()
  entityType: ExportEntityType;
}
