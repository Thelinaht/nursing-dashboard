import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function revertDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log("Reverting DB changes...");
        const [rows] = await connection.query("DESCRIBE messages");
        const hasIsRead = rows.some(row => row.Field === 'is_read');

        if (hasIsRead) {
            console.log("Dropping 'is_read' column from 'messages' table...");
            await connection.query("ALTER TABLE messages DROP COLUMN is_read");
            console.log("Column dropped successfully.");
        } else {
            console.log("'is_read' column not found.");
        }
    } catch (err) {
        console.error("Revert failed:", err);
    } finally {
        await connection.end();
        process.exit();
    }
}

revertDB();
