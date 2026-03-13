import { Prisma } from '../client/client';
import { ClsService } from 'nestjs-cls';

/**
 * Symbol-like property to prevent infinite recursion when the extension
 * calls client methods internally.
 */
const SKIP_TENANT = '_skipTenantExtension';

export const multiTenantExtension = (cls: ClsService) => {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'multi-tenant',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // 1. Exclude global models and recursion
            const globalModels = ['Tenant', 'SupportedLanguage', 'RefreshToken'];
            if (globalModels.includes(model) || (args as any)[SKIP_TENANT]) {
              return query(args);
            }

            // 2. Get current tenant context
            const tenantId = cls.get('tenantId');

            // 3. If no tenant context, bypass
            if (!tenantId) {
              return query(args);
            }

            // 4. Inject tenant_id for mutations
            if (model !== 'StudentIdCounter') {
              if (operation === 'create' || operation === 'createMany') {
                if ((args as any).data) {
                  if (Array.isArray((args as any).data)) {
                    (args as any).data = (args as any).data.map((item: any) => ({
                      ...item,
                      tenantId,
                    }));
                  } else {
                    (args as any).data = { ...(args as any).data, tenantId };
                  }
                }
              }

              if (operation === 'upsert') {
                if ((args as any).create) {
                  (args as any).create = { ...(args as any).create, tenantId };
                }
                if ((args as any).update) {
                  (args as any).update = { ...(args as any).update, tenantId };
                }
              }
            }

            // 5. Inject tenant_id filter for queries
            const tenantFilteredOperations = [
              'findFirst',
              'findFirstOrThrow',
              'findMany',
              'count',
              'update',
              'updateMany',
              'delete',
              'deleteMany',
            ];

            if (tenantFilteredOperations.includes(operation)) {
              (args as any).where = { ...(args as any).where, tenantId };
            }

            // 6. Special handling for findUnique: Convert to findFirst to enforce tenant filtering
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              let where = args.where || {};

              // Unwrapping logic for compound unique constraints (e.g. { tenantId_slug: { tenantId, slug } })
              const keys = Object.keys(where);
              if (keys.length === 1) {
                const key = keys[0];
                const value = where[key];

                if (
                  typeof value === 'object' &&
                  value !== null &&
                  !Array.isArray(value) &&
                  !['AND', 'OR', 'NOT'].includes(key)
                ) {
                  // This is likely a compound unique wrapper, unwrap it for findFirst compatibility
                  where = { ...value };
                }
              }

              // Route to findFirst / findFirstOrThrow with injected tenantId and recursion guard
              const targetOperation = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
              return (client as any)[model][targetOperation]({
                ...args,
                where: { ...where, tenantId },
                [SKIP_TENANT]: true,
              });
            }

            return query(args);
          },
        },
      },
    });
  });
};
