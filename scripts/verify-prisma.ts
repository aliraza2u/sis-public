import { multiTenantExtension } from "../src/infrastructure/prisma/extensions/multi-tenant.extension";

async function testExtension() {
  console.log("Testing Multi-Tenant Extension Logic...");

  const cls = {
    get: (key: string) => {
      if (key === "tenantId") return "test-tenant-id";
      return null;
    },
  } as any;

  const extension = multiTenantExtension(cls);
  
  // The extension is a function that returns an object with 'query' or other Prisma extension properties
  // We can inspect the extension object to verify its structure
  console.log("Extension keys:", Object.keys(extension));
  
  if (extension.query) {
    console.log("Extension has query handlers for:", Object.keys(extension.query));
  }

  // Since we can't easily bootstrap a full PrismaClient without a real DB/Adapter in this environment,
  // verifying the module loads and the extension initializes is the primary goal.
  console.log("\nSuccess: Module and Extension loaded correctly.");
}

testExtension().catch(console.error);
