const mysql = require("mysql2/promise");
require("dotenv").config();

async function test() {
    try {
        console.log("Connecting to:", process.env.DB_HOST, process.env.DB_PORT);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT),
            connectTimeout: 5000
        });
        console.log("SUCCESS!");
        await connection.end();
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}
test();
