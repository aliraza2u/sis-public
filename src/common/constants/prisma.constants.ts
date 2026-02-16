import { HttpStatus } from '@nestjs/common';
import { PrismaErrorCode } from '@/common/enums/prisma-error-code.enum';

export const PRISMA_ERROR_MAPPING: Record<
  string,
  {
    status: HttpStatus;
    key: string;
    args?: (meta: any) => Record<string, any>;
  }
> = {
  [PrismaErrorCode.ValueTooLong]: {
    status: HttpStatus.BAD_REQUEST,
    key: 'messages.prisma.valueTooLong',
  },
  [PrismaErrorCode.UniqueConstraintVioaltion]: {
    status: HttpStatus.CONFLICT,
    key: 'messages.prisma.duplicateEntry',
    args: (meta) => ({ target: meta?.target || '' }),
  },
  [PrismaErrorCode.ForeignKeyConstraintViolation]: {
    status: HttpStatus.CONFLICT,
    key: 'messages.prisma.foreignKeyConstraint',
    args: (meta) => ({ field: meta?.field_name || 'relation' }),
  },
  [PrismaErrorCode.InconsistentData]: {
    status: HttpStatus.BAD_REQUEST,
    key: 'messages.prisma.inconsistentData',
  },
  [PrismaErrorCode.RecordNotFound]: {
    status: HttpStatus.NOT_FOUND,
    key: 'messages.prisma.notFound',
  },
};
