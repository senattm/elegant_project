-- =====================================================
-- ELEGĀNT E-TİCARET VERİTABANI INSERT KOMUTLARI
-- Massimo Dutti Tarzı Kategoriler ve Ürünler
-- =====================================================
-- NOT: Bu komutları manuel olarak çalıştırın!
-- =====================================================

-- 1. KATEGORİLER (Massimo Dutti Tarzı)
-- =====================================================

-- Ana Kategori
INSERT INTO categories (name, parent_id) VALUES 
('KADIN', NULL);

-- Alt Kategoriler
INSERT INTO categories (name, parent_id) VALUES 
('Elbiseler', 1),
('Kazaklar & Hırkalar', 1),
('Bluzlar & Gömlekler', 1),
('Ceketler & Kabanlar', 1),
('Pantolonlar', 1),
('Ayakkabılar', 1),
('Çantalar & Aksesuarlar', 1);

-- =====================================================
-- 2. ÜRÜNLER (48 Adet)
-- =====================================================

-- ELBİSELER (6 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Midi Kesim Saten Elbise', 'Zarif saten kumaştan üretilmiş, midi boy elbise. Özel günler için ideal.', 1299.00, 15, 2),
('V Yaka Desenli Elbise', 'Çiçek desenli, V yaka detaylı günlük elbise. Rahat kesim.', 899.00, 20, 2),
('Asimetrik Kesim Kokteyl Elbise', 'Modern çizgilerle tasarlanmış asimetrik kokteyl elbise. Şık ve zarif.', 1499.00, 12, 2),
('Uzun Kollu Gömlek Elbise', 'Klasik gömlek detaylı, beli kemerli günlük elbise. Çok yönlü kullanım.', 799.00, 25, 2),
('Pileli Maxi Elbise', 'Akışkan kumaştan pileli maxi elbise. Şık ve rahat.', 1199.00, 18, 2),
('Dantelli Midi Elbise', 'Dantell detaylı, zarif midi elbise. Özel davetler için mükemmel.', 1399.00, 10, 2);

-- KAZAKLAR & HIRKALAR (7 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Yün Karışımlı Boğazlı Kazak', 'Yumuşak yün karışımlı, boğazlı klasik kazak. Kış için ideal.', 599.00, 30, 3),
('Oversize Triko Kazak', 'Rahat kesim oversize triko kazak. Modern ve şık.', 549.00, 25, 3),
('V Yaka İnce Kazak', 'Zarif V yaka detaylı ince kazak. Katmanlı kombinler için uygun.', 449.00, 35, 3),
('Uzun Hırka', 'Akışkan kumaştan uzun hırka. Şık ve rahat.', 799.00, 20, 3),
('Düğmeli Triko Hırka', 'Klasik düğmeli triko hırka. Zamansız şıklık.', 699.00, 22, 3),
('Desenli Yün Kazak', 'Geometrik desenli yün kazak. Dikkat çekici tasarım.', 649.00, 18, 3),
('Polo Yaka Kazak', 'Şık polo yaka detaylı triko kazak. Zarif görünüm.', 579.00, 28, 3);

-- BLUZLAR & GÖMLEKLER (11 ürün - 5 bluz + 6 gömlek)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('İpek Karışımlı Saten Bluz', 'Lüks ipek karışımlı saten bluz. Özel günler için ideal.', 899.00, 15, 4),
('Fırfır Detaylı Şifon Bluz', 'Romantik fırfır detaylı şifon bluz. Zarif ve feminen.', 649.00, 20, 4),
('V Yaka Basic Bluz', 'Her kombine uygun V yaka basic bluz. Zamansız parça.', 449.00, 40, 4),
('Desenli Viskon Bluz', 'Çiçek desenli, rahat kesim viskon bluz. Günlük şıklık.', 599.00, 25, 4),
('Omuz Detaylı Bluz', 'Modern omuz detaylı, asimetrik kesim bluz. Dikkat çekici tasarım.', 749.00, 18, 4),
('Klasik Beyaz Gömlek', 'Zamansız beyaz gömlek. Gardırobun olmazsa olmazı.', 699.00, 35, 4),
('Oversize Keten Gömlek', 'Rahat kesim, doğal keten gömlek. Yaz favorisi.', 799.00, 22, 4),
('Çizgili Poplin Gömlek', 'Klasik çizgili poplin gömlek. Şık ve zarif.', 649.00, 28, 4),
('Saten Gömlek', 'Yumuşak saten kumaştan şık gömlek. Özel günler için.', 849.00, 20, 4),
('Denim Gömlek', 'Klasik denim gömlek. Çok yönlü kullanım.', 599.00, 30, 4),
('İşlemeli Gömlek', 'El işi işleme detaylı özel gömlek. Benzersiz tasarım.', 999.00, 12, 4);

-- CEKETLER & KABANLAR (7 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Yün Karışımlı Blazer Ceket', 'Klasik kesim yün blazer ceket. Ofis şıklığı.', 1599.00, 15, 5),
('Oversize Trençkot', 'Modern kesim oversize trençkot. Zamansız parça.', 2299.00, 10, 5),
('Deri Görünümlü Biker Ceket', 'Rock tarzı deri görünümlü biker ceket. Dikkat çekici.', 1299.00, 18, 5),
('Yün Kaban', 'Klasik kesim, uzun yün kaban. Kış favorisi.', 2499.00, 12, 5),
('Kapitone Şişme Mont', 'Hafif ve sıcak tutan kapitone mont. Pratik kullanım.', 1099.00, 25, 5),
('Çift Sıra Düğmeli Blazer', 'Şık çift sıra düğmeli blazer ceket. Zarif görünüm.', 1699.00, 14, 5),
('Uzun Yün Palto', 'Zarif uzun yün palto. Kış şıklığı.', 2799.00, 8, 5);

-- PANTOLONLAR (5 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Yüksek Bel Kumaş Pantolon', 'Zarif yüksek bel kumaş pantolon. Ofis şıklığı.', 799.00, 30, 6),
('Wide Leg Pantolon', 'Modern wide leg kesim pantolon. Rahat ve şık.', 899.00, 25, 6),
('Straight Fit Jean', 'Klasik straight fit jean pantolon. Zamansız.', 649.00, 40, 6),
('Palazzo Pantolon', 'Akışkan kumaştan palazzo pantolon. Şık ve rahat.', 849.00, 22, 6),
('Beli Kemerli Pantolon', 'Kemer detaylı, yüksek bel pantolon. Zarif kesim.', 949.00, 20, 6);

-- AYAKKABILAR (6 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Deri Topuklu Bot', 'Klasik deri topuklu bot. Kış şıklığı.', 1499.00, 15, 7),
('Düz Taban Loafer', 'Rahat düz taban loafer ayakkabı. Günlük şıklık.', 899.00, 25, 7),
('Süet Topuklu Ayakkabı', 'Zarif süet topuklu ayakkabı. Özel günler için.', 1299.00, 18, 7),
('Deri Spor Ayakkabı', 'Minimal tasarım deri spor ayakkabı. Şık ve rahat.', 1099.00, 30, 7),
('Bilekten Bağlamalı Sandalet', 'Zarif bilekten bağlamalı sandalet. Yaz favorisi.', 799.00, 20, 7),
('Chelsea Bot', 'Klasik Chelsea bot. Zamansız parça.', 1399.00, 16, 7);

-- ÇANTALAR & AKSESUARLAR (6 ürün)
-- =====================================================
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Deri Kol Çantası', 'Klasik deri kol çantası. Zarif ve şık.', 1999.00, 12, 8),
('Crossbody Çanta', 'Pratik crossbody çanta. Günlük kullanım için ideal.', 1299.00, 20, 8),
('Büyük Boy Shopper Çanta', 'Geniş shopper çanta. İşlevsel ve şık.', 1499.00, 15, 8),
('Mini Deri Çanta', 'Zarif mini deri çanta. Özel günler için.', 1699.00, 10, 8),
('Zincir Detaylı Çanta', 'Modern zincir detaylı omuz çantası. Dikkat çekici.', 1899.00, 14, 8),
('Clutch Çanta', 'Şık clutch çanta. Gece davetleri için mükemmel.', 999.00, 18, 8);

-- =====================================================
-- 3. ÜRÜN RESİMLERİ (48 Adet)
-- =====================================================

-- Elbise Resimleri (6 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(1, '/images/elbise1.webp', TRUE),
(2, '/images/elbise2.webp', TRUE),
(3, '/images/elbise3.webp', TRUE),
(4, '/images/elbise4.jpg', TRUE),
(5, '/images/elbise5.jpg', TRUE),
(6, '/images/elbise6.jpg', TRUE);

-- Kazak & Hırka Resimleri (7 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(7, '/images/kazak1.webp', TRUE),
(8, '/images/kazak2.webp', TRUE),
(9, '/images/kazak3.webp', TRUE),
(10, '/images/kazak4.webp', TRUE),
(11, '/images/kazak5.webp', TRUE),
(12, '/images/kazak6.webp', TRUE),
(13, '/images/kazak7.webp', TRUE);

-- Bluz & Gömlek Resimleri (11 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(14, '/images/bluz1.webp', TRUE),
(15, '/images/bluz2.webp', TRUE),
(16, '/images/bluz3.webp', TRUE),
(17, '/images/bluz4.webp', TRUE),
(18, '/images/bluz5.webp', TRUE),
(19, '/images/gomlek1.webp', TRUE),
(20, '/images/gomlek2.webp', TRUE),
(21, '/images/gomlek3.jpg', TRUE),
(22, '/images/gomlek4.webp', TRUE),
(23, '/images/gomlek5.jpg', TRUE),
(24, '/images/gomlek6.webp', TRUE);

-- Ceket & Kaban Resimleri (7 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(25, '/images/ceket1.webp', TRUE),
(26, '/images/ceket2.webp', TRUE),
(27, '/images/ceket3.webp', TRUE),
(28, '/images/ceket4.webp', TRUE),
(29, '/images/ceket5.webp', TRUE),
(30, '/images/ceket6.webp', TRUE),
(31, '/images/ceket7.webp', TRUE);

-- Pantolon Resimleri (5 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(32, '/images/pantolon1.webp', TRUE),
(33, '/images/pantolon2.webp', TRUE),
(34, '/images/pantolon3.webp', TRUE),
(35, '/images/pantolon4.webp', TRUE),
(36, '/images/pantolon5.webp', TRUE);

-- Ayakkabı Resimleri (6 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(37, '/images/ayakkabi1.jpg', TRUE),
(38, '/images/ayakkabi2.jpg', TRUE),
(39, '/images/ayakkabi3.jpg', TRUE),
(40, '/images/ayakkabi4.jpg', TRUE),
(41, '/images/ayakkabi5.jpg', TRUE),
(42, '/images/ayakkabi6.jpg', TRUE);

-- Çanta Resimleri (6 adet)
INSERT INTO product_images (product_id, image_url, is_main) VALUES 
(43, '/images/canta1.jpg', TRUE),
(44, '/images/canta2.jpg', TRUE),
(45, '/images/canta3.jpg', TRUE),
(46, '/images/canta4.jpg', TRUE),
(47, '/images/canta5.jpg', TRUE),
(48, '/images/canta6.jpg', TRUE);

-- =====================================================
-- ÖRNEK SORGU: Tüm ürünleri kategorileriyle birlikte görüntüle
-- =====================================================
-- SELECT 
--   p.id, 
--   p.name AS ürün_adı, 
--   p.price AS fiyat, 
--   p.stock AS stok,
--   c.name AS kategori,
--   pi.image_url AS resim
-- FROM products p
-- LEFT JOIN categories c ON p.category_id = c.id
-- LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
-- ORDER BY c.name, p.name;

-- =====================================================
-- ÖZET İSTATİSTİKLER
-- =====================================================
-- Toplam Kategori: 8 (1 ana + 7 alt)
-- Toplam Ürün: 48
-- Toplam Resim: 48
-- 
-- Kategori Dağılımı:
-- - Elbiseler: 6 ürün
-- - Kazaklar & Hırkalar: 7 ürün
-- - Bluzlar & Gömlekler: 11 ürün
-- - Ceketler & Kabanlar: 7 ürün
-- - Pantolonlar: 5 ürün
-- - Ayakkabılar: 6 ürün
-- - Çantalar & Aksesuarlar: 6 ürün
-- =====================================================

