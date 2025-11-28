require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Statik dosyalar
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
const productsRouter = require("./routes/products");
app.use("/api/products", productsRouter);

// Test endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server çalışıyor" });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;
