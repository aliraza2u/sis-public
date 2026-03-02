#!/bin/sh
set -e

echo "Starting production startup sequence..."

# 1. Run Migrations
echo "Running migrations..."
npx prisma migrate deploy

# 2. Seed Languages
echo "Seeding languages..."
node dist/scripts/seed-languages.js

# 5. Start Application
echo "Starting application..."
exec node dist/main
