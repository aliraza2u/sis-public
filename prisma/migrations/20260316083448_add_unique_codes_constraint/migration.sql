/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,code]` on the table `batches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "activity_types" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('ACT');

-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('APP');

-- AlterTable
ALTER TABLE "assignment_contents" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('AC');

-- AlterTable
ALTER TABLE "batches" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('BAT');

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CAT');

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CRS');

-- AlterTable
ALTER TABLE "import_jobs" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('IMP');

-- AlterTable
ALTER TABLE "lesson_contents" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('LC');

-- AlterTable
ALTER TABLE "module_item_progress" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('MIP');

-- AlterTable
ALTER TABLE "module_items" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('MI');

-- AlterTable
ALTER TABLE "modules" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('MOD');

-- AlterTable
ALTER TABLE "prerequisites" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('PRQ');

-- AlterTable
ALTER TABLE "quiz_contents" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('QC');

-- AlterTable
ALTER TABLE "quiz_options" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('QO');

-- AlterTable
ALTER TABLE "quiz_questions" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('QQ');

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('RT');

-- AlterTable
ALTER TABLE "resources" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('RES');

-- AlterTable
ALTER TABLE "student_id_counters" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CTR');

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('TNT');

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('UPF');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('USR');

-- CreateIndex
CREATE UNIQUE INDEX "batches_tenant_id_code_key" ON "batches"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenant_id_code_key" ON "courses"("tenant_id", "code");
