-- CreateEnum
CREATE TYPE "GradeSource" AS ENUM ('manual', 'import');

-- CreateEnum
CREATE TYPE "GradeResult" AS ENUM ('pass', 'fail');

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

-- CreateTable
CREATE TABLE "student_course_grades" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('GRD'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "application_id" VARCHAR(50),
    "source" "GradeSource" NOT NULL DEFAULT 'manual',
    "final_result" "GradeResult" NOT NULL,
    "final_grade" VARCHAR(10),
    "final_score" DECIMAL(5,2),
    "breakdown" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_course_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_course_grades_tenant_id_idx" ON "student_course_grades"("tenant_id");

-- CreateIndex
CREATE INDEX "student_course_grades_user_id_idx" ON "student_course_grades"("user_id");

-- CreateIndex
CREATE INDEX "student_course_grades_course_id_idx" ON "student_course_grades"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_grades_tenant_id_user_id_course_id_key" ON "student_course_grades"("tenant_id", "user_id", "course_id");

-- AddForeignKey
ALTER TABLE "student_course_grades" ADD CONSTRAINT "student_course_grades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_grades" ADD CONSTRAINT "student_course_grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
