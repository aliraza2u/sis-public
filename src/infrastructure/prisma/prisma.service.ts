import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './client/client';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { ClsService } from 'nestjs-cls';
import { auditExtension } from './extensions/audit.extension';
import { softDeleteExtension } from './extensions/soft-delete.extension';
import { multiTenantExtension } from './extensions/multi-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private extendedClient: any;

  constructor(
    private configService: ConfigService,
    private readonly cls: ClsService,
  ) {
    const pool = new Pool({
      connectionString: configService.get<string>('database.url'),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });

    this.extendedClient = this.$extends(auditExtension(this.cls))
      .$extends(softDeleteExtension(this.cls))
      .$extends(multiTenantExtension(this.cls));

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // If the property exists on the extended client, use it
        // We exclude $connect/$disconnect/onModuleInit from extended check effectively by priority
        // But extensions don't usually override them.
        // However, standard models (user, tenant) ARE on extended client.
        if (prop in target.extendedClient) {
          return target.extendedClient[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
