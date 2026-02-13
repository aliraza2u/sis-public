/*
  Warnings:

  - You are about to drop the column `duration_weeks` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `syllabus` on the `courses` table. All the data in the column will be lost.
  - The primary key for the `refresh_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('pdf', 'link', 'file');

-- DropIndex
DROP INDEX "import_jobs_status_idx";

-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('APP');

-- AlterTable
ALTER TABLE "batches" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('BAT');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "description" JSONB DEFAULT '{}',
ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CAT');

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "duration_weeks",
DROP COLUMN "syllabus",
ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CRS');

-- AlterTable
ALTER TABLE "import_jobs" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('IMP'),
ALTER COLUMN "source_file_path" SET DATA TYPE TEXT,
ALTER COLUMN "failed_rows_path" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_pkey",
ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('RT'),
ALTER COLUMN "id" SET DATA TYPE VARCHAR(50),
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "student_id_counters" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CTR');

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('TNT');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('USR'),
ALTER COLUMN "password_hash" SET NOT NULL;

-- CreateTable
CREATE TABLE "activity_types" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('ACT'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "description" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('MOD'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "description" JSONB DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_items" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('MI'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "module_id" VARCHAR(50) NOT NULL,
    "activity_type_id" VARCHAR(50) NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "description" JSONB DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completion_rules" JSONB DEFAULT '{}',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "module_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_contents" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('LC'),
    "module_item_id" VARCHAR(50) NOT NULL,
    "video_url" VARCHAR(500),
    "title" JSONB DEFAULT '{}',
    "thumbnail_url" VARCHAR(500),
    "description" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_contents" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('QC'),
    "module_item_id" VARCHAR(50) NOT NULL,
    "passing_score" INTEGER NOT NULL DEFAULT 0,
    "time_limit_minutes" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "quiz_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('QQ'),
    "quiz_id" VARCHAR(50) NOT NULL,
    "question_text" JSONB NOT NULL DEFAULT '{}',
    "question_type" VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('QO'),
    "question_id" VARCHAR(50) NOT NULL,
    "option_text" JSONB NOT NULL DEFAULT '{}',
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_contents" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('AC'),
    "module_item_id" VARCHAR(50) NOT NULL,
    "instructions" JSONB NOT NULL DEFAULT '{}',
    "due_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "assignment_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisites" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('PRQ'),
    "module_item_id" VARCHAR(50) NOT NULL,
    "prerequisite_item_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('RES'),
    "module_item_id" VARCHAR(50) NOT NULL,
    "title" JSONB DEFAULT '{}',
    "resource_type" "ResourceType" NOT NULL,
    "resource_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),
    "tenant_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_item_progress" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('MIP'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "module_item_id" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "module_item_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_types_tenant_id_idx" ON "activity_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_tenant_id_code_key" ON "activity_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "modules_tenant_id_idx" ON "modules"("tenant_id");

-- CreateIndex
CREATE INDEX "modules_course_id_idx" ON "modules"("course_id");

-- CreateIndex
CREATE INDEX "module_items_tenant_id_idx" ON "module_items"("tenant_id");

-- CreateIndex
CREATE INDEX "module_items_module_id_idx" ON "module_items"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_contents_module_item_id_key" ON "lesson_contents"("module_item_id");

-- CreateIndex
CREATE INDEX "lesson_contents_tenant_id_idx" ON "lesson_contents"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_contents_module_item_id_key" ON "quiz_contents"("module_item_id");

-- CreateIndex
CREATE INDEX "quiz_contents_tenant_id_idx" ON "quiz_contents"("tenant_id");

-- CreateIndex
CREATE INDEX "quiz_questions_quiz_id_idx" ON "quiz_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_questions_tenant_id_idx" ON "quiz_questions"("tenant_id");

-- CreateIndex
CREATE INDEX "quiz_options_question_id_idx" ON "quiz_options"("question_id");

-- CreateIndex
CREATE INDEX "quiz_options_tenant_id_idx" ON "quiz_options"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_contents_module_item_id_key" ON "assignment_contents"("module_item_id");

-- CreateIndex
CREATE INDEX "assignment_contents_tenant_id_idx" ON "assignment_contents"("tenant_id");

-- CreateIndex
CREATE INDEX "prerequisites_module_item_id_idx" ON "prerequisites"("module_item_id");

-- CreateIndex
CREATE INDEX "prerequisites_tenant_id_idx" ON "prerequisites"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "prerequisites_module_item_id_prerequisite_item_id_key" ON "prerequisites"("module_item_id", "prerequisite_item_id");

-- CreateIndex
CREATE INDEX "resources_module_item_id_idx" ON "resources"("module_item_id");

-- CreateIndex
CREATE INDEX "resources_tenant_id_idx" ON "resources"("tenant_id");

-- CreateIndex
CREATE INDEX "module_item_progress_tenant_id_idx" ON "module_item_progress"("tenant_id");

-- CreateIndex
CREATE INDEX "module_item_progress_user_id_idx" ON "module_item_progress"("user_id");

-- CreateIndex
CREATE INDEX "module_item_progress_module_item_id_idx" ON "module_item_progress"("module_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_item_progress_user_id_module_item_id_key" ON "module_item_progress"("user_id", "module_item_id");

-- AddForeignKey
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_items" ADD CONSTRAINT "module_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_items" ADD CONSTRAINT "module_items_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_items" ADD CONSTRAINT "module_items_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_contents" ADD CONSTRAINT "quiz_contents_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_contents" ADD CONSTRAINT "quiz_contents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_contents" ADD CONSTRAINT "assignment_contents_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_contents" ADD CONSTRAINT "assignment_contents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_prerequisite_item_id_fkey" FOREIGN KEY ("prerequisite_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_item_progress" ADD CONSTRAINT "module_item_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_item_progress" ADD CONSTRAINT "module_item_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_item_progress" ADD CONSTRAINT "module_item_progress_module_item_id_fkey" FOREIGN KEY ("module_item_id") REFERENCES "module_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
