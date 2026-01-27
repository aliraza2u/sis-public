CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION generate_prefixed_uuid(prefix text) RETURNS text AS $$
BEGIN
    RETURN prefix || '-' || uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('applicant', 'reviewer', 'admin', 'super_admin');

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

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(50) NOT NULL DEFAULT generate_prefixed_uuid('USR'),
    "tenant_id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" JSONB NOT NULL DEFAULT '{}',
    "last_name" JSONB NOT NULL DEFAULT '{}',
    "phone" VARCHAR(50),
    "role" "UserRole" NOT NULL,
    "avatar_url" VARCHAR(500),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ,
    "preferred_language" VARCHAR(5) DEFAULT 'ar',
    "last_login_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_default_language_fkey" FOREIGN KEY ("default_language") REFERENCES "supported_languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_language_fkey" FOREIGN KEY ("preferred_language") REFERENCES "supported_languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;
