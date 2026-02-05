import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DataTransferService } from './data-transfer.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/infrastructure/prisma/client/client';
import {
  ImportRequestDto,
  ImportEntityType,
  ImportJobResponseDto,
  ImportJobListResponseDto,
  ImportJobErrorsResponseDto,
  ExportRequestDto,
} from './dto';
import { ImportJobEntity } from './entities/import-job.entity';

@ApiTags('Data Transfer')
@Controller('data-transfer')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class DataTransferController {
  constructor(private readonly dataTransferService: DataTransferService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload CSV file and start async import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file to import',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file (max 10MB)',
        },
        entityType: {
          type: 'string',
          enum: ['user', 'tenant'],
          description: 'Type of entity to import',
        },
      },
      required: ['file', 'entityType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import job created successfully',
    type: ImportJobEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: ImportEntityType,
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<ImportJobEntity> {
    const job = await this.dataTransferService.initiateImport(
      file,
      entityType,
      user.id,
      user.tenantId,
    );
    return new ImportJobEntity(job);
  }

  @Get('import/jobs')
  @ApiOperation({ summary: 'List import job history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Import jobs retrieved',
    type: ImportJobListResponseDto,
  })
  async listImportJobs(
    @CurrentUser() user: { id: string },
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ): Promise<ImportJobListResponseDto> {
    const { jobs, total } = await this.dataTransferService.listJobs(user.id, {
      skip,
      take,
    });
    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        entityType: job.entityType,
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successCount: job.successCount,
        errorCount: job.errorCount,
        progress: job.progress,
        startedAt: job.startedAt || undefined,
        completedAt: job.completedAt || undefined,
        createdAt: job.createdAt,
      })),
      total,
    };
  }

  @Get('import/jobs/:id')
  @ApiOperation({ summary: 'Get import job status and progress' })
  @ApiResponse({
    status: 200,
    description: 'Import job status retrieved',
    type: ImportJobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  async getImportJobStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<ImportJobResponseDto> {
    const job = await this.dataTransferService.getJobStatus(id, user.id);
    return {
      id: job.id,
      entityType: job.entityType,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successCount: job.successCount,
      errorCount: job.errorCount,
      progress: job.progress,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      createdAt: job.createdAt,
    };
  }

  @Get('import/jobs/:id/errors')
  @ApiOperation({ summary: 'Get failed rows with error details' })
  @ApiResponse({
    status: 200,
    description: 'Error details retrieved',
    type: ImportJobErrorsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  async getImportJobErrors(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<ImportJobErrorsResponseDto> {
    const { errors, total } = await this.dataTransferService.getJobErrors(id, user.id);
    return {
      errors: errors as any[],
      total,
    };
  }

  @Get('import/jobs/:id/errors/download')
  @ApiOperation({ summary: 'Download failed rows as CSV' })
  @ApiResponse({
    status: 200,
    description: 'Failed rows CSV file',
    content: {
      'text/csv': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Failed rows file not found' })
  async downloadFailedRows(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ): Promise<void> {
    const csvBuffer = await this.dataTransferService.getFailedRowsCsv(id, user.id);

    if (!csvBuffer) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: 'No failed rows available for this import job',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="failed-rows-${id}.csv"`);
    res.send(csvBuffer);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export data to CSV file' })
  @ApiQuery({
    name: 'entityType',
    enum: ImportEntityType,
    description: 'Type of entity to export',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV export file',
    content: {
      'text/csv': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportCsv(
    @Query('entityType') entityType: ImportEntityType,
    @CurrentUser() user: { tenantId: string },
    @Res() res: Response,
  ): Promise<void> {
    const { content, filename } = await this.dataTransferService.exportToCsv(
      entityType,
      user.tenantId,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
