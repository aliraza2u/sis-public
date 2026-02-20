import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import * as net from 'net';
import { TENANT_HEADER } from '../constants/headers';
import { I18nService } from 'nestjs-i18n';
import { SYSTEM_ROUTES } from '../constants/routes';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 0. Bypass for bootstrap-import (Belt & Suspenders)
    if (
      req.originalUrl === SYSTEM_ROUTES.BOOTSTRAP_IMPORT ||
      req.path === SYSTEM_ROUTES.BOOTSTRAP_IMPORT
    ) {
      return next();
    }

    // 1. Check for X-Tenant-ID header (Dev/Testing priority)
    let tenantSlug = req.headers[TENANT_HEADER] as string;

    // 2. Check if this is the Render deployment URL and use default tenant
    if (!tenantSlug) {
      const renderExternalHostname = process.env.RENDER_EXTERNAL_HOSTNAME;
      const defaultTenantSlug = process.env.DEFAULT_TENANT_SLUG;

      if (renderExternalHostname && defaultTenantSlug && req.hostname === renderExternalHostname) {
        tenantSlug = defaultTenantSlug;
      }
    }

    // 3. Check subdomain if no header and not Render deployment
    if (!tenantSlug) {
      const hostname = req.hostname;

      // Ignore if IP (e.g. 127.0.0.1) or strictly 'localhost'
      if (!net.isIP(hostname) && hostname !== 'localhost') {
        // Assuming format: {slug}.domain.com
        const parts = hostname.split('.');
        if (parts.length > 2) {
          // e.g. tenant-slug.almkki.com -> parts: ['tenant-slug', 'almkki', 'com']
          tenantSlug = parts[0];
        }
      }
    }

    // 4. If no tenant identified, bypass
    if (!tenantSlug) {
      return next();
    }

    // 4. Validate Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException(
        this.i18n.t('messages.tenant.notFound', { args: { slug: tenantSlug } }),
      );
    }

    if (!tenant.isActive) {
      throw new NotFoundException(
        this.i18n.t('messages.tenant.inactive', { args: { slug: tenantSlug } }),
      );
    }

    // 5. Store in CLS
    this.cls.set('tenant', tenant);
    this.cls.set('tenantId', tenant.id);

    next();
  }
}
