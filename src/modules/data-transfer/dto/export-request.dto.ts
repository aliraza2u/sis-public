import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';

export class ExportRequestDto {
  @ApiProperty({
    description: 'Type of entity to export',
    enum: ImportEntityType,
    example: ImportEntityType.USER,
  })
  @IsEnum(ImportEntityType)
  @IsNotEmpty()
  entityType: ImportEntityType;
}
