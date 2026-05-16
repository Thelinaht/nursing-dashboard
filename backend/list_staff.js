const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/.env" });

async function listStaff() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    });
    const [rows] = await pool.query(`
        SELECT u.email, ns.full_name, r.role_name
        FROM User u
        JOIN Nursing_staff ns ON u.user_id = ns.user_id
        JOIN UserRole ur ON u.user_id = ur.user_id
        JOIN Role r ON ur.role_id = r.role_id
    `);
    console.table(rows);
    process.exit();
}
listStaff();
