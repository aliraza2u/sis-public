import { Prisma } from '../client/client';
import { ClsService } from 'nestjs-cls';

export const multiTenantExtension = (cls: ClsService) => {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'multi-tenant',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // 1. Exclude global models
            const globalModels = ['Tenant', 'SupportedLanguage', 'RefreshToken'];
            if (globalModels.includes(model)) {
              return query(args);
            }

            // 2. Get current tenant context
            const tenantId = cls.get('tenantId');

            // 3. If no tenant context, bypass (required for system tasks/public access)
            if (!tenantId) {
              return query(args);
            }

            // 4. Inject tenant_id for mutations
            // Skip StudentIdCounter as it handles tenancy manually via connect and has unique constraints on contextKey
            if (model !== 'StudentIdCounter') {
              if (operation === 'create' || operation === 'createMany') {
                if ((args as any).data) {
                  if (Array.isArray((args as any).data)) {
                    (args as any).data = (args as any).data.map((item) => ({ ...item, tenantId }));
                  } else {
                    (args as any).data = { ...(args as any).data, tenantId };
                  }
                }
              }

              // Handle upsert specifically: inject tenantId into create and update payloads
              if (operation === 'upsert') {
                if ((args as any).create) {
                  (args as any).create = { ...(args as any).create, tenantId };
                }
                if ((args as any).update) {
                  // Determine if update is an object or primitive (though usually object in upsert)
                  (args as any).update = { ...(args as any).update, tenantId };
                }
              }
            }

            // 5. Inject tenant_id filter for queries (excluding findUnique and upsert which rely on exact unique constraints)
            // We explicitely list operations where filtering by tenantId in 'where' is safe and desired.
            const tenantFilteredOperations = [
              'findFirst',
              'findFirstOrThrow',
              'findMany',
              'count',
              'update', // Note: update by ID might fail if not composite unique, but commonly needed for security
              'updateMany',
              'delete',
              'deleteMany',
            ];

            if (tenantFilteredOperations.includes(operation) && (args as any).where) {
              (args as any).where = { ...(args as any).where, tenantId };
            }

            // 6. Special handling for findUnique: Convert to findFirst to enforce tenant filtering
            if (operation === 'findUnique') {
              let where = args.where;

              // Heuristic to unwrap compound unique constraints for findFirst compatibility
              // If the where clause has a nested structure like { tenantId_slug: { tenantId: '...', slug: '...' } }
              // we need to flatten it because findFirst expects { tenantId: '...', slug: '...' }
              if (where) {
                const keys = Object.keys(where);
                // Check if it's likely a compound unique wrapper (single key, value is object)
                if (keys.length === 1) {
                  const key = keys[0];
                  const value = where[key];

                  // Ensure we don't unwrap AND/OR/NOT blocks
                  if (
                    typeof value === 'object' &&
                    value !== null &&
                    !Array.isArray(value) &&
                    !['AND', 'OR', 'NOT'].includes(key)
                  ) {
                    // We assume this is a compound unique wrapper.
                    // We take the properties of the inner object.
                    where = { ...value };
                  }
                }
              }

              return client[model].findFirst({
                ...args,
                where: { ...where, tenantId },
              });
            }

            return query(args);
          },
        },
      },
    });
  });
};
