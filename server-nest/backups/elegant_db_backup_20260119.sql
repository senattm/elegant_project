
INSERT INTO categories (id, name, parent_id, created_at) VALUES
(1, 'Elbiseler', NULL, NOW()),
(2, 'Ceketler & Kabanlar', NULL, NOW()),
(3, 'Ayakkabılar', NULL, NOW()),
(4, 'Çantalar & Aksesuarlar', NULL, NOW()),
(5, 'Bluzlar & Gömlekler', NULL, NOW()),
(6, 'Kazaklar & Hırkalar', NULL, NOW()),
(7, 'Pantolonlar', NULL, NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(1, 'Siyah Yaka Detaylı Elbise', 'Zarif yaka detaylı siyah elbise', 2699.00, 15, 1, NOW(), NOW()),
(2, 'Beyaz Midi Elbise', 'Klasik beyaz midi boy elbise', 2899.00, 12, 1, NOW(), NOW()),
(3, 'Kırmızı Kokteyl Elbisesi', 'Şık kokteyl elbisesi', 3199.00, 8, 1, NOW(), NOW()),
(4, 'Lacivert Gece Elbisesi', 'Zarif gece elbisesi', 3599.00, 10, 1, NOW(), NOW()),
(5, 'Yeşil Günlük Elbise', 'Rahat günlük elbise', 2399.00, 20, 1, NOW(), NOW()),
(6, 'Desenli Yaz Elbisesi', 'Hafif yaz elbisesi', 2299.00, 18, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(7, 'Siyah Deri Ceket', 'Klasik deri ceket', 3899.00, 10, 2, NOW(), NOW()),
(8, 'Bej Trençkot', 'Şık trençkot', 3299.00, 12, 2, NOW(), NOW()),
(9, 'Lacivert Blazer', 'Ofis blazer ceket', 2999.00, 15, 2, NOW(), NOW()),
(10, 'Gri Yün Kaban', 'Sıcak yün kaban', 4199.00, 8, 2, NOW(), NOW()),
(11, 'Kahverengi Süet Ceket', 'Süet detaylı ceket', 3599.00, 10, 2, NOW(), NOW()),
(12, 'Beyaz Bomber Ceket', 'Spor bomber ceket', 2699.00, 14, 2, NOW(), NOW()),
(13, 'Haki Parka', 'Kapüşonlu parka', 3399.00, 11, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(14, 'Siyah Topuklu Ayakkabı', 'Klasik siyah topuklu', 2299.00, 20, 3, NOW(), NOW()),
(15, 'Beyaz Spor Ayakkabı', 'Rahat beyaz spor ayakkabı', 2199.00, 25, 3, NOW(), NOW()),
(16, 'Kahverengi Kürklü Topuklu Çizme', 'Kışlık kürklü çizme', 2699.00, 15, 3, NOW(), NOW()),
(17, 'Topuklu Cam Ayakkabı', 'Şeffaf detaylı topuklu', 2399.00, 18, 3, NOW(), NOW()),
(18, 'Kırmızı Stiletto', 'Zarif kırmızı stiletto', 2599.00, 12, 3, NOW(), NOW()),
(19, 'Kahverengi Topuklu Bot', 'Klasik kahverengi bot', 2099.00, 22, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(20, 'Siyah Deri Çanta', 'Klasik deri çanta', 2999.00, 12, 4, NOW(), NOW()),
(21, 'Kahverengi Omuz Çantası', 'Büyük omuz çantası', 2799.00, 15, 4, NOW(), NOW()),
(22, 'Beyaz Mini Çanta', 'Şık mini çanta', 2399.00, 18, 4, NOW(), NOW()),
(23, 'Lacivert Tote Bag', 'Günlük kullanım çantası', 2299.00, 20, 4, NOW(), NOW()),
(24, 'Kırmızı Clutch', 'Gece çantası', 2199.00, 14, 4, NOW(), NOW()),
(25, 'Bordo Örgü Mini Çanta', 'Trend örgü çanta', 3199.00, 10, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(26, 'Beyaz Gömlek', 'Klasik beyaz gömlek', 1999.00, 25, 5, NOW(), NOW()),
(27, 'Siyah Bluz', 'Şık siyah bluz', 2099.00, 20, 5, NOW(), NOW()),
(28, 'Çizgili Gömlek', 'Çizgili desenli gömlek', 2149.00, 18, 5, NOW(), NOW()),
(29, 'Pembe Saten Bluz', 'Saten kumaş bluz', 2299.00, 15, 5, NOW(), NOW()),
(30, 'Lacivert Gömlek', 'Lacivert klasik gömlek', 2049.00, 22, 5, NOW(), NOW()),
(31, 'Krem Bluz', 'Krem rengi bluz', 2099.00, 20, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(32, 'Gri Triko Kazak', 'Yumuşak triko kazak', 2299.00, 18, 6, NOW(), NOW()),
(33, 'Beyaz Balıkçı Yaka', 'Balıkçı yaka kazak', 2199.00, 20, 6, NOW(), NOW()),
(34, 'Siyah Hırka', 'Uzun hırka', 2399.00, 15, 6, NOW(), NOW()),
(35, 'Kahverengi Yün Kazak', 'Yün kazak', 2599.00, 12, 6, NOW(), NOW()),
(36, 'Lacivert Triko', 'Klasik triko', 2249.00, 18, 6, NOW(), NOW()),
(37, 'Kırmızı Kazak', 'Kırmızı triko kazak', 2299.00, 16, 6, NOW(), NOW()),
(38, 'Bej Hırka', 'Uzun bej hırka', 2499.00, 14, 6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

INSERT INTO products (id, name, description, price, stock, category_id, created_at, updated_at) VALUES
(39, 'Siyah Kumaş Pantolon', 'Klasik kumaş pantolon', 2199.00, 20, 7, NOW(), NOW()),
(40, 'Mavi Jean', 'Slim fit jean', 2099.00, 25, 7, NOW(), NOW()),
(41, 'Bej Chino', 'Rahat chino pantolon', 2149.00, 22, 7, NOW(), NOW()),
(42, 'Gri Bol Paça', 'Bol paça pantolon', 2299.00, 18, 7, NOW(), NOW()),
(43, 'Lacivert Kumaş Pantolon', 'Ofis pantolonu', 2249.00, 20, 7, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  stock = EXCLUDED.stock;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(1, '/images/elbise1.webp', true), (1, '/images/elbise1.2.webp', false), (1, '/images/elbise1.3.webp', false),
(2, '/images/elbise2.webp', true), (2, '/images/elbise2.2.webp', false), (2, '/images/elbise2.3.webp', false),
(3, '/images/elbise3.webp', true), (3, '/images/elbise3.2.webp', false), (3, '/images/elbise3.3.webp', false),
(4, '/images/elbise4.jpg', true), (4, '/images/elbise4.2.webp', false), (4, '/images/elbise4.3.webp', false),
(5, '/images/elbise5.jpg', true), (5, '/images/elbise5.2.jpg', false), (5, '/images/elbise5.3.jpg', false),
(6, '/images/elbise6.jpg', true), (6, '/images/elbise6.2.jpg', false), (6, '/images/elbise6.3.jpg', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(7, '/images/ceket1.webp', true), (7, '/images/ceket1.2.webp', false), (7, '/images/ceket1.3.webp', false),
(8, '/images/ceket2.webp', true), (8, '/images/ceket2.2.webp', false), (8, '/images/ceket2.3.webp', false),
(9, '/images/ceket3.webp', true), (9, '/images/ceket3.2.webp', false), (9, '/images/ceket3.3.webp', false),
(10, '/images/ceket4.webp', true), (10, '/images/ceket4.2.webp', false), (10, '/images/ceket4.3.webp', false),
(11, '/images/ceket5.webp', true), (11, '/images/ceket5.2.webp', false), (11, '/images/ceket5.3.webp', false),
(12, '/images/ceket6.webp', true), (12, '/images/ceket6.2.webp', false), (12, '/images/ceket6.3.webp', false),
(13, '/images/ceket7.webp', true), (13, '/images/ceket7.2.webp', false), (13, '/images/ceket7.3.webp', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(14, '/images/ayakkabi1.jpg', true), (14, '/images/ayakkabi1.2.jpg', false),
(15, '/images/ayakkabi2.jpg', true), (15, '/images/ayakkabi2.2.jpg', false),
(16, '/images/ayakkabi3.jpg', true), (16, '/images/ayakkabi3.2.jpg', false),
(17, '/images/ayakkabi4.jpg', true), (17, '/images/ayakkabi4.2.jpg', false),
(18, '/images/ayakkabi5.jpg', true), (18, '/images/ayakkabi5.2.jpg', false),
(19, '/images/ayakkabi6.jpg', true), (19, '/images/ayakkabi6.2.jpg', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(20, '/images/canta1.jpg', true), (20, '/images/canta1.2.jpg', false),
(21, '/images/canta2.jpg', true), (21, '/images/canta2.2.jpg', false),
(22, '/images/canta3.jpg', true), (22, '/images/canta3.2.jpg', false),
(23, '/images/canta4.jpg', true), (23, '/images/canta4.2.jpg', false),
(24, '/images/canta5.jpg', true), (24, '/images/canta5.2.jpg', false),
(25, '/images/canta6.jpg', true), (25, '/images/canta6.2.jpg', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(26, '/images/gomlek1.webp', true), (26, '/images/gomlek1.2.webp', false), (26, '/images/gomlek1.3.webp', false),
(27, '/images/bluz1.webp', true), (27, '/images/bluz1.2.webp', false), (27, '/images/bluz1.3.webp', false),
(28, '/images/gomlek2.webp', true), (28, '/images/gomlek2.2.webp', false), (28, '/images/gomlek2.3.webp', false),
(29, '/images/bluz2.webp', true), (29, '/images/bluz2.2.webp', false), (29, '/images/bluz2.3.webp', false),
(30, '/images/gomlek3.jpg', true), (30, '/images/gomlek3.2.jpg', false), (30, '/images/gomlek3.3.jpg', false),
(31, '/images/bluz3.webp', true), (31, '/images/bluz3.2.webp', false), (31, '/images/bluz3.3.webp', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(32, '/images/kazak1.webp', true), (32, '/images/kazak1.2.webp', false), (32, '/images/kazak1.3.webp', false),
(33, '/images/kazak2.webp', true), (33, '/images/kazak2.2.webp', false), (33, '/images/kazak2.3.webp', false),
(34, '/images/kazak3.webp', true), (34, '/images/kazak3.2.webp', false), (34, '/images/kazak3.3.webp', false),
(35, '/images/kazak4.webp', true), (35, '/images/kazak4.2.webp', false), (35, '/images/kazak4.3.webp', false),
(36, '/images/kazak5.webp', true), (36, '/images/kazak5.2.webp', false), (36, '/images/kazak5.3.webp', false),
(37, '/images/kazak6.webp', true), (37, '/images/kazak6.2.webp', false), (37, '/images/kazak6.3.webp', false),
(38, '/images/kazak7.webp', true), (38, '/images/kazak7.2.webp', false), (38, '/images/kazak7.3.webp', false)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_main) VALUES
(39, '/images/pantolon1.webp', true), (39, '/images/pantolon1.2.webp', false), (39, '/images/pantolon1.3.webp', false),
(40, '/images/pantolon2.webp', true), (40, '/images/pantolon2.2.webp', false), (40, '/images/pantolon2.3.webp', false),
(41, '/images/pantolon3.webp', true), (41, '/images/pantolon3.2.webp', false), (41, '/images/pantolon3.3.webp', false),
(42, '/images/pantolon4.webp', true), (42, '/images/pantolon4.2.webp', false), (42, '/images/pantolon4.3.webp', false),
(43, '/images/pantolon5.webp', true), (43, '/images/pantolon5.2.webp', false), (43, '/images/pantolon5.3.webp', false)
ON CONFLICT DO NOTHING;
