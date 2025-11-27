require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "elegant_db",
  user: "postgres",
  password: "123456", // String olarak
});

pool
  .connect()
  .then(() => console.log("PostgreSQL bağlı"))
  .catch((err) => console.error("Bağlantı hatası", err));

module.exports = pool;
