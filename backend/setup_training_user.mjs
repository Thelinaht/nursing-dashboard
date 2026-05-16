import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function setupUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        // 1. Check/Insert Role
        const [roles] = await connection.query("SELECT * FROM Role WHERE role_id = 6");
        if (roles.length === 0) {
            console.log("Inserting Training Director role...");
            await connection.query("INSERT INTO Role (role_id, role_name) VALUES (6, 'Training Director')");
        }

        // 2. Check/Insert User
        const email = 'training@hospital.com';
        const [users] = await connection.query("SELECT * FROM User WHERE email = ?", [email]);
        
        let userId;
        if (users.length === 0) {
            console.log("Creating Training Director user...");
            const hashedPassword = await bcrypt.hash('password123', 10);
            const [userResult] = await connection.query(
                "INSERT INTO User (email, password_hash) VALUES (?, ?)",
                [email, hashedPassword]
            );
            userId = userResult.insertId;

            await connection.query("INSERT INTO UserRole (user_id, role_id) VALUES (?, ?)", [userId, 6]);
            await connection.query("INSERT INTO Nursing_staff (user_id, full_name) VALUES (?, ?)", [userId, 'Dr. Sarah (Training Dir)']);
            
            console.log(`User created! Email: ${email}, Password: password123`);
        } else {
            console.log(`User already exists. Email: ${email}`);
            userId = users[0].user_id;
            
            const hashedPassword = await bcrypt.hash('password123', 10);
            await connection.query("UPDATE User SET password_hash = ? WHERE email = ?", [hashedPassword, email]);
            
            // make sure user has role 6
            const [userRoles] = await connection.query("SELECT * FROM UserRole WHERE user_id = ? AND role_id = 6", [userId]);
            if (userRoles.length === 0) {
                await connection.query("INSERT INTO UserRole (user_id, role_id) VALUES (?, ?)", [userId, 6]);
            }
            console.log(`Password reset to: password123 and role ensured.`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await connection.end();
        process.exit();
    }
}

setupUser();
