-- Database Schema Güncellemeleri
-- =====================================================
-- Mevcut tablolara selected_size kolonları ekle

-- Order Items tablosuna selected_size kolonu ekle
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_size VARCHAR(10);

-- Cart Items tablosuna selected_size kolonu ekle
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS selected_size VARCHAR(10);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_order_items_selected_size ON order_items(selected_size);
CREATE INDEX IF NOT EXISTS idx_cart_items_selected_size ON cart_items(selected_size);



