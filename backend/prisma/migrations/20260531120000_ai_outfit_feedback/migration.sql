-- AlterTable
ALTER TABLE "outfits" ADD COLUMN "user_id" INTEGER,
ADD COLUMN "seed_product_id" INTEGER,
ADD COLUMN "cohesion_score" DOUBLE PRECISION,
ADD COLUMN "source" VARCHAR(50),
ADD COLUMN "feedback" INTEGER,
ADD COLUMN "feedback_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "outfits_user_id_idx" ON "outfits"("user_id");
CREATE INDEX "outfits_seed_product_id_idx" ON "outfits"("seed_product_id");

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_seed_product_id_fkey" FOREIGN KEY ("seed_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
