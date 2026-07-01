-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brand" VARCHAR(100),
ADD COLUMN     "colors" JSONB DEFAULT '[]',
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "season" JSONB DEFAULT '[]',
ADD COLUMN     "source" VARCHAR(50),
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "style_attrs" JSONB DEFAULT '{}',
ADD COLUMN     "tags" JSONB DEFAULT '[]';

-- CreateIndex
CREATE INDEX "products_gender_idx" ON "products"("gender");
