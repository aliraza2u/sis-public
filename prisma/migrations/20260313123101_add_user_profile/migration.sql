-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

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
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('USR');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('UPF'),
    "user_id" VARCHAR(50) NOT NULL,
    "tenant_id" VARCHAR(50) NOT NULL,
    "date_of_birth" DATE,
    "gender" "Gender",
    "nationality" VARCHAR(100),
    "national_id" VARCHAR(50),
    "passport_no" VARCHAR(50),
    "address" JSONB DEFAULT '{}',
    "guardian" JSONB DEFAULT '{}',
    "education" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_tenant_id_idx" ON "user_profiles"("tenant_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
