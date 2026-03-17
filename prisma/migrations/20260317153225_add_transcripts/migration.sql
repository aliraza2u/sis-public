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
ALTER TABLE "student_course_grades" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('GRD');

-- AlterTable
ALTER TABLE "student_id_counters" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('CTR');

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('TNT');

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('UPF');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT generate_prefixed_uuid('USR');

-- CreateTable
CREATE TABLE "transcripts" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('TRN'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "transcript_number" VARCHAR(100) NOT NULL,
    "verification_token" VARCHAR(500) NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_transcript_number_key" ON "transcripts"("transcript_number");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_verification_token_key" ON "transcripts"("verification_token");

-- CreateIndex
CREATE INDEX "transcripts_tenant_id_idx" ON "transcripts"("tenant_id");

-- CreateIndex
CREATE INDEX "transcripts_user_id_idx" ON "transcripts"("user_id");

-- CreateIndex
CREATE INDEX "transcripts_transcript_number_idx" ON "transcripts"("transcript_number");

-- CreateIndex
CREATE INDEX "transcripts_verification_token_idx" ON "transcripts"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_tenant_id_user_id_key" ON "transcripts"("tenant_id", "user_id");

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
