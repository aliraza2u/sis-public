/*
  Warnings:

  - The values [applicant] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('student', 'reviewer', 'admin', 'super_admin');

ALTER TABLE "users" ADD COLUMN "roles" "UserRole_new"[];

UPDATE "users" 
SET "roles" = ARRAY[
  CASE 
    WHEN "role"::text = 'applicant' THEN 'student'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
];

ALTER TABLE "users" DROP COLUMN "role";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

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
