-- Product ID 5'e elbise5.2.jpg ve elbise5.3.jpg görsellerini ekle

-- Elbise5.2.jpg ekle
INSERT INTO product_images (product_id, image_url, is_main)
VALUES (5, 'elbise5.2.jpg', false);

-- Elbise5.3.jpg ekle
INSERT INTO product_images (product_id, image_url, is_main)
VALUES (5, 'elbise5.3.jpg', false);

-- Kontrol et
SELECT 
    p.id,
    p.name,
    pi.image_url,
    pi.is_main
FROM products p
JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = 5
ORDER BY pi.image_url;

