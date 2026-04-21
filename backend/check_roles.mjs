import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkRoles() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const [rows] = await connection.query("SELECT * FROM Role");
        console.log("Available Roles:");
        console.table(rows);
    } catch (err) {
        console.error("Error fetching roles:", err);
    } finally {
        await connection.end();
        process.exit();
    }
}

checkRoles();
