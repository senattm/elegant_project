const express = require("express");
const router = express.Router();
const pool = require("../db");

// Tüm ürünleri getir
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        c.name AS category,
        pi.image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Ürünler alınamadı:", error);
    res.status(500).json({ error: "Ürünler alınamadı" });
  }
});

module.exports = router;
