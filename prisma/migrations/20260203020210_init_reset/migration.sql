-- Create function for prefixed UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION generate_prefixed_uuid(prefix text)
RETURNS text AS $$
BEGIN
    RETURN prefix || '-' || gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('applicant', 'reviewer', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "supported_languages" (
    "code" VARCHAR(5) NOT NULL,
    "name_english" VARCHAR(100) NOT NULL,
    "name_native" VARCHAR(100) NOT NULL,
    "is_rtl" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supported_languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('TNT'),
    "name" JSONB NOT NULL DEFAULT '{}',
    "slug" VARCHAR(100) NOT NULL,
    "alias" VARCHAR(10),
    "logo_url" VARCHAR(500),
    "primary_color" VARCHAR(7) DEFAULT '#1B4F72',
    "secondary_color" VARCHAR(7) DEFAULT '#2E86AB',
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(50),
    "address" JSONB DEFAULT '{}',
    "website" VARCHAR(255),
    "default_language" VARCHAR(5) DEFAULT 'ar',
    "enabled_languages" TEXT[] DEFAULT ARRAY['en', 'ar']::TEXT[],
    "timezone" VARCHAR(50) DEFAULT 'Asia/Riyadh',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('USR'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_password_created" BOOLEAN NOT NULL DEFAULT false,
    "first_name" JSONB NOT NULL DEFAULT '{}',
    "last_name" JSONB NOT NULL DEFAULT '{}',
    "phone" VARCHAR(50),
    "role" "UserRole" NOT NULL,
    "avatar_url" VARCHAR(500),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "verification_token" VARCHAR(255),
    "verification_token_expires" TIMESTAMPTZ,
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ,
    "preferred_language" VARCHAR(5) DEFAULT 'ar',
    "last_login_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replaced_by_token" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('CAT'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "name" JSONB NOT NULL DEFAULT '{}',
    "slug" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('CRS'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "description" JSONB DEFAULT '{}',
    "short_description" JSONB DEFAULT '{}',
    "thumbnail_url" VARCHAR(500),
    "category_id" VARCHAR(50),
    "level" VARCHAR(50),
    "duration_weeks" INTEGER,
    "prerequisites" JSONB DEFAULT '[]',
    "learning_outcomes" JSONB DEFAULT '[]',
    "syllabus" JSONB DEFAULT '{}',
    "required_documents" JSONB DEFAULT '[]',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "code" VARCHAR(10),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('BAT'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "name" JSONB NOT NULL DEFAULT '{}',
    "code" VARCHAR(50),
    "batch_number" VARCHAR(10) NOT NULL,
    "enrollment_start_date" DATE NOT NULL,
    "enrollment_end_date" DATE NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "max_students" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('APP'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "batch_id" VARCHAR(50) NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "applicant_id" VARCHAR(50) NOT NULL,
    "application_number" VARCHAR(20) NOT NULL,
    "roll_number" VARCHAR(50),
    "personal_info" JSONB NOT NULL DEFAULT '{}',
    "guardian_info" JSONB DEFAULT '{}',
    "education_info" JSONB DEFAULT '{}',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMPTZ,
    "reviewed_by" VARCHAR(50),
    "reviewed_at" TIMESTAMPTZ,
    "review_notes" TEXT,
    "rejection_reason" JSONB DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" VARCHAR(50),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_id_counters" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('CTR'),
    "context_key" VARCHAR(100) NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" VARCHAR(50) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_id_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "courses_tenant_id_idx" ON "courses"("tenant_id");

-- CreateIndex
CREATE INDEX "batches_tenant_id_idx" ON "batches"("tenant_id");

-- CreateIndex
CREATE INDEX "batches_course_id_idx" ON "batches"("course_id");

-- CreateIndex
CREATE INDEX "applications_tenant_id_idx" ON "applications"("tenant_id");

-- CreateIndex
CREATE INDEX "applications_batch_id_idx" ON "applications"("batch_id");

-- CreateIndex
CREATE INDEX "applications_applicant_id_idx" ON "applications"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_tenant_id_application_number_key" ON "applications"("tenant_id", "application_number");

-- CreateIndex
CREATE UNIQUE INDEX "applications_batch_id_applicant_id_key" ON "applications"("batch_id", "applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_id_counters_context_key_key" ON "student_id_counters"("context_key");

-- CreateIndex
CREATE INDEX "student_id_counters_tenant_id_idx" ON "student_id_counters"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_default_language_fkey" FOREIGN KEY ("default_language") REFERENCES "supported_languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_language_fkey" FOREIGN KEY ("preferred_language") REFERENCES "supported_languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_id_counters" ADD CONSTRAINT "student_id_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
