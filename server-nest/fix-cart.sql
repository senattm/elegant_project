-- Cart items unique constraint düzeltmesi

-- 1. Eski constraint'i kaldır
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- 2. Yeni unique index ekle (selected_size dahil)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique 
ON cart_items (user_id, product_id, COALESCE(selected_size, ''));

-- Açıklama:
-- Artık aynı ürünü farklı bedenlerle ekleyebilirsin
-- COALESCE ile NULL değerler boş string olarak işlenir

