import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the User-Agent header from the request.
 *
 * @returns The User-Agent string or undefined if not present
 */
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers['user-agent'];
  },
);
