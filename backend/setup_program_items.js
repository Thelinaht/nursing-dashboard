const pool = require('./src/db');

async function main() {
    try {
        console.log("Creating Training_Program_Item table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Training_Program_Item (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                location_provider VARCHAR(255) DEFAULT NULL,
                duration VARCHAR(100) DEFAULT NULL,
                cost_or_status VARCHAR(100) DEFAULT NULL
            )
        `);
        
        // check if empty
        const [rows] = await pool.query("SELECT COUNT(*) AS count FROM Training_Program_Item");
        if (rows[0].count === 0) {
            console.log("Seeding table...");
            await pool.query(`
                INSERT INTO Training_Program_Item (category, title, location_provider, duration, cost_or_status) VALUES
                ('outside', 'Advanced Trauma Life Support', 'King Fahad Hospital', '3 Days', '$450'),
                ('outside', 'Leadership in Nursing', 'Virtual Seminar', '1 Day', '$150'),
                ('inside', 'IV Therapy Recertification', 'Main Hall A', '4 Hours', NULL),
                ('inside', 'New EMR System Training', 'Lab 3', '8 Hours', NULL),
                ('cross', 'M. Ali', 'NICU ➔ Pediatric Ward', 'Starts: 2026-06-01', 'Active'),
                ('cross', 'S. Khan', 'MedSurg ➔ ER Triage', 'Completed', 'Completed')
            `);
            console.log("Seeded!");
        } else {
            console.log("Table already has data, skipping seed.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

main();
