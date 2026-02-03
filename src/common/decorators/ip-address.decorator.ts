import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the real IP address from the request.
 *
 * Checks the following headers in order:
 * 1. X-Forwarded-For (used by most proxies/load balancers)
 * 2. X-Real-IP (used by nginx)
 * 3. CF-Connecting-IP (Cloudflare)
 * 4. request.ip (Express default)
 *
 * @returns The IP address as a string
 */
export const IpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();

  // Check X-Forwarded-For (can be a comma-separated list)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  // Fallback to Express request.ip
  return request.ip || 'unknown';
});
