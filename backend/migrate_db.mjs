import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log("Checking for 'is_read' column...");
        const [rows] = await connection.query("DESCRIBE messages");
        const hasIsRead = rows.some(row => row.Field === 'is_read');

        if (!hasIsRead) {
            console.log("Adding 'is_read' column to 'messages' table...");
            await connection.query("ALTER TABLE messages ADD COLUMN is_read TINYINT(1) DEFAULT 0");
            console.log("Column added successfully.");
        } else {
            console.log("'is_read' column already exists.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
        process.exit();
    }
}

migrate();
