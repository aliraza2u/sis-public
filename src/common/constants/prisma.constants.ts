import { HttpStatus } from '@nestjs/common';

export const PRISMA_ERROR_MAPPING: Record<
  string,
  {
    status: HttpStatus;
    key: string;
    args?: (meta: any) => Record<string, any>;
  }
> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    key: 'messages.prisma.valueTooLong',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    key: 'messages.prisma.duplicateEntry',
    args: (meta) => ({ target: meta?.target || '' }),
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    key: 'messages.prisma.foreignKeyConstraint',
    args: (meta) => ({ field: meta?.field_name || 'relation' }),
  },
  P2023: {
    status: HttpStatus.BAD_REQUEST,
    key: 'messages.prisma.inconsistentData',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    key: 'messages.prisma.notFound',
  },
};
