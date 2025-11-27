const express = require("express");
const cors = require("cors");
const path = require("path");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Statik dosyalar
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);

// Test endpoint
app.get("/", (req, res) => {
  res.json({ message: "ELEGĀNT API çalışıyor!" });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;
