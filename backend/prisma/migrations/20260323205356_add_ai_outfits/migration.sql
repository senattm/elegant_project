-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brand" VARCHAR(100),
ADD COLUMN     "colors" JSONB DEFAULT '[]',
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "season" JSONB DEFAULT '[]',
ADD COLUMN     "source" VARCHAR(50),
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "style_attrs" JSONB DEFAULT '{}',
ADD COLUMN     "tags" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "outfits" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200),
    "occasion" VARCHAR(100),
    "season" VARCHAR(50),
    "gender" VARCHAR(10),
    "style" VARCHAR(100),
    "is_ai" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_items" (
    "id" SERIAL NOT NULL,
    "outfit_id" INTEGER,
    "product_id" INTEGER,
    "role" VARCHAR(50),
    "sort_order" INTEGER DEFAULT 0,

    CONSTRAINT "outfit_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outfits_gender_idx" ON "outfits"("gender");

-- CreateIndex
CREATE INDEX "outfits_occasion_idx" ON "outfits"("occasion");

-- CreateIndex
CREATE INDEX "outfit_items_outfit_id_idx" ON "outfit_items"("outfit_id");

-- CreateIndex
CREATE INDEX "outfit_items_product_id_idx" ON "outfit_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "outfit_items_outfit_id_product_id_key" ON "outfit_items"("outfit_id", "product_id");

-- CreateIndex
CREATE INDEX "products_gender_idx" ON "products"("gender");

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
