const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Tüm alanları doldurun" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
    }

    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Bu email zaten kayıtlı" });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name, email, password]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: "Kayıt başarılı",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: "token-" + user.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Kayıt işlemi başarısız" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email ve şifre gerekli" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    const user = result.rows[0];

    if (password !== user.password_hash) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    res.json({
      message: "Giriş başarılı",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: "token-" + user.id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Giriş işlemi başarısız" });
  }
});

module.exports = router;
