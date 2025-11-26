require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/elegant_db"
});


pool.connect()
  .then(() => console.log("PostgreSQL bağlı"))
  .catch(err => console.error("Bağlantı hatası", err));

module.exports = pool;
