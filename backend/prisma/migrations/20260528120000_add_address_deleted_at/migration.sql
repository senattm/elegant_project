-- AlterTable
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);
