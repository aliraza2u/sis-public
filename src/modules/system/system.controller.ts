import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { SystemService } from './system.service';
import { BootstrapAuthGuard } from './guards/bootstrap-auth.guard';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('bootstrap-import')
  @Public()
  @UseGuards(BootstrapAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bootstrap import of Tenant/User (Admin only, Empty DB only)' })
  @ApiHeader({
    name: 'x-migration-token',
    description: 'Secret token for bootstrap migration',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityType: {
          type: 'string',
          enum: [ImportEntityType.TENANT, ImportEntityType.USER],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Import successful' })
  @ApiResponse({ status: 403, description: 'Forbidden (Invalid token or DB not empty)' })
  async bootstrapImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: ImportEntityType,
  ) {
    return this.systemService.bootstrapImport(file, entityType);
  }
}
