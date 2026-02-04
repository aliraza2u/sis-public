#!/bin/sh
set -e

echo "Starting production startup sequence..."

# 1. Run Migrations
echo "Running migrations..."
npx prisma migrate deploy

# 2. Seed Tenant (Safe to run multiple times)
echo "Seeding tenant..."
node dist/scripts/seed-tenant.js

# 3. Create Admin (Optional, safe to run multiple times)
if [ ! -z "$ADMIN_EMAIL" ]; then
    echo "Creating/Checking admin user..."
    # Set non-interactive mode for the script
    export NON_INTERACTIVE=true
    node dist/scripts/create-admin.js
fi

# 4. Seed Dummy Users (Optional)
if [ "$SEED_DUMMY_USERS" = "true" ]; then
    echo "Seeding dummy users..."
    node dist/scripts/seed-users.js
fi

# 5. Start Application
echo "Starting application..."
exec node dist/main
