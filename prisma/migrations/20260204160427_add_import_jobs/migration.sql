-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('APP');

-- AlterTable
ALTER TABLE "batches" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('BAT');

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CAT');

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CRS');

-- AlterTable
ALTER TABLE "student_id_counters" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CTR');

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('TNT');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('USR');

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('IMP'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source_file_path" VARCHAR(500),
    "failed_rows_path" VARCHAR(500),
    "error_details" JSONB,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_jobs_tenant_id_idx" ON "import_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");
