const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  res.json({ message: "Orders endpoint" });
});

module.exports = router;
