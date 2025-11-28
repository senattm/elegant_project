require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images")));

const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server çalışıyor" });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;
