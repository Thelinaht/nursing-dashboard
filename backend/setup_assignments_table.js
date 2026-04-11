const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/.env" });

async function setup() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT)
        });

        console.log("Creating DailyAssignment table if it doesn't exist...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS DailyAssignment (
                assignment_id INT PRIMARY KEY AUTO_INCREMENT,
                nurse_id INT NOT NULL,
                unit VARCHAR(100) NOT NULL,
                shift ENUM('Day', 'Evening', 'Night') NOT NULL,
                assignment_date DATE NOT NULL,
                FOREIGN KEY (nurse_id) REFERENCES Nursing_staff(nurse_id) ON DELETE CASCADE
            )
        `);

        console.log("DailyAssignment table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

setup();
