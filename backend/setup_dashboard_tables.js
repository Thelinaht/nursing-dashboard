const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/.env" });

async function setupDashboardTables() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306
        });

        console.log("Creating new dashboard tables if they don't exist...");

        // 1. Incidents Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Incidents (
                incident_id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved BOOLEAN DEFAULT FALSE
            )
        `);
        console.log("✔ Incidents table ready.");

        // 2. Nurse Satisfaction Survey Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Nurse_Satisfaction (
                survey_id INT PRIMARY KEY AUTO_INCREMENT,
                month VARCHAR(50) NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ Nurse_Satisfaction table ready.");

        // 3. Unit Requirements Table (For "Total Required Nurses" metrics)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Unit_Requirement (
                requirement_id INT PRIMARY KEY AUTO_INCREMENT,
                unit_name VARCHAR(100) NOT NULL,
                required_nurses INT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ Unit_Requirement table ready.");

        // Insert some dummy data ONLY if the tables were just created (or are empty)
        const [incidents] = await pool.query("SELECT COUNT(*) as count FROM Incidents");
        if (incidents[0].count === 0) {
            console.log("Inserting placeholder data into Incidents...");
            await pool.query(`
                INSERT INTO Incidents (title, severity) VALUES 
                ('SICU license expiry approaching (3 days)', 'Critical'),
                ('ER staffing low on Night Shift', 'High'),
                ('Training overdue for 14 staff', 'High')
            `);
        }

        console.log("All dashboard tables created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

setupDashboardTables();
