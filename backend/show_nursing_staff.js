const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/.env" });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    });
    const [rows] = await pool.query("DESCRIBE Nursing_staff");
    console.log(rows);
    process.exit();
}
check();
