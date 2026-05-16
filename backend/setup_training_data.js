const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const nurses = [
    "MS. HEBA DARDAS", "MS. GHADA MAGHRABI", "MS. EZDEHAR BARBARI", "MS. NAJLA AL ANSARI", 
    "DR. AYAT AL SAWAD", "DR. RASHA AL TURKI", "MS. RABAB EMSHAMEA", "MS. MANAL GHAZAL", 
    "MS. NOURA AL-NASSER", "MS. NADA AL SHAIF", "MS. ZAINAB ALAWAMI", "MS. JENNY ANNE SERRANO", 
    "MS. NOUF AL SAQABI", "MS. OLA ALI AL MARHOON", "MS. VIVIEN GO", "MR. WALAN AL MUTAIRI", 
    "MS. DALAL AL SAYEL", "MS. NAWAL AL ENIZI", "MS. LAILA AL SHAWAF", "MS. MOUDI AL SHAMMARY", 
    "MS. RANDA AL JOHANI", "MS. NOOF AL SALHI", "MS. AMNA AL HAMOUD", "MS. NEDHAL AL KHALIFA", 
    "MS. VICTORIA EMPLEO", "MS. JAYALUXMI GOVENDER", "MS. BINDHU PHILIP", "MS. ILYN FRONDA", 
    "MS. USHARANI RAJU", "MS. ROSMALEEN BALDONADO", "MS. HUDA MAHFOUDH", "MS. MARICRIS MARCELO"
];

const trainingPrograms = [
    { name: "BLS", category: "Mandatory", mandatory: 1 },
    { name: "Fire and Safety", category: "Mandatory", mandatory: 1 },
    { name: "Infection Control", category: "Mandatory", mandatory: 1 },
    { name: "Medication Safety Program", category: "Mandatory", mandatory: 1 },
    { name: "BISCL", category: "Competency", mandatory: 1 },
    { name: "FMS", category: "Mandatory", mandatory: 1 },
    // Some non-mandatory ones just in case
    { name: "Ventilator Management", category: "Competency", mandatory: 0 },
    { name: "Triage Protocol", category: "Competency", mandatory: 0 }
];

const certificateTypes = [
    { name: "Saudi Council", validity: 24 },
    { name: "ACLS", validity: 24 },
    { name: "PALS", validity: 24 }
];

const trainees = [
    { name: "Sara Ahmed", uni: "IAU", type: "IAU Intern" },
    { name: "Khalid Ali", uni: "KSU", type: "SCFHS Trainee" },
    { name: "Noura Saad", uni: "IAU", type: "Summer Training" },
    { name: "Mohammed Al-Qahtani", uni: "KFUPM", type: "Non-IAU Intern" },
    { name: "Layan Fahad", uni: "IAU", type: "IAU Intern" }
];

// Helper to generate a random date between two dates
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function setup() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    console.log("Connected to DB. Seeding Training Data...");

    try {
        // 1. Insert Nurses
        console.log("Inserting Nurses...");
        const nurseIds = {};
        for (const name of nurses) {
            // check if exists
            const [existing] = await conn.query("SELECT nurse_id FROM Nursing_staff WHERE full_name = ?", [name]);
            if (existing.length > 0) {
                nurseIds[name] = existing[0].nurse_id;
            } else {
                const [res] = await conn.query(
                    "INSERT INTO Nursing_staff (full_name, status, unit) VALUES (?, 'Active', 'General')",
                    [name]
                );
                nurseIds[name] = res.insertId;
            }
        }

        // 2. Insert Training Programs
        console.log("Inserting Training Programs...");
        const programIds = {};
        for (const tp of trainingPrograms) {
            const [existing] = await conn.query("SELECT training_id FROM Training_program WHERE training_name = ?", [tp.name]);
            if (existing.length > 0) {
                programIds[tp.name] = existing[0].training_id;
            } else {
                const [res] = await conn.query(
                    "INSERT INTO Training_program (training_name, training_category, mandatory, description) VALUES (?, ?, ?, 'Mock Description')",
                    [tp.name, tp.category, tp.mandatory]
                );
                programIds[tp.name] = res.insertId;
            }
        }

        // 3. Insert Certificate Types
        console.log("Inserting Certificate Types...");
        const certIds = {};
        for (const ct of certificateTypes) {
            const [existing] = await conn.query("SELECT certificate_type_id FROM Certificate_type WHERE certificate_name = ?", [ct.name]);
            if (existing.length > 0) {
                certIds[ct.name] = existing[0].certificate_type_id;
            } else {
                const [res] = await conn.query(
                    "INSERT INTO Certificate_type (certificate_name, validity_months) VALUES (?, ?)",
                    [ct.name, ct.validity]
                );
                certIds[ct.name] = res.insertId;
            }
        }

        // 4. Seed Staff Trainings & Certificates (Mimicking the grid)
        console.log("Inserting Staff Training & Certificates...");
        
        const today = new Date();
        const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
        const twoYearsFuture = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());

        for (const name of nurses) {
            const nId = nurseIds[name];
            
            // Saudi Council (Certificate)
            if (Math.random() > 0.1 || name === "MS. VICTORIA EMPLEO") {
                let expiry = getRandomDate(today, twoYearsFuture);
                if (name === "MS. VICTORIA EMPLEO") expiry = new Date('2025-03-06'); // From image (red)

                await conn.query(`
                    INSERT IGNORE INTO Staff_certificate (nurse_id, certificate_type_id, certificate_number, expiry_date, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [nId, certIds["Saudi Council"], "SC" + Math.floor(Math.random()*10000), expiry, expiry < today ? "Expired" : "Verified"]);
            }

            // Iterate over mandatory courses
            const courses = ["BLS", "Fire and Safety", "Infection Control", "Medication Safety Program", "BISCL", "FMS"];
            for (const course of courses) {
                // Not everyone has every course
                if (Math.random() < 0.8 || name === "MS. VICTORIA EMPLEO" || course === "FMS") {
                    
                    let expiry = getRandomDate(today, twoYearsFuture);
                    let status = "Completed";

                    if (name === "MS. VICTORIA EMPLEO") {
                        if (course === "BLS") expiry = new Date('2025-08-11');
                        if (course === "Fire and Safety") { expiry = new Date('2024-01-29'); status = "Expired"; }
                        if (course === "Infection Control") { expiry = new Date('2024-01-29'); status = "Expired"; }
                    }

                    // FMS in image just has checkmarks
                    if (course === "FMS") {
                        expiry = new Date('2099-12-31'); // Doesn't expire
                    }

                    if (expiry < today && status !== "Expired") status = "Overdue";

                    await conn.query(`
                        INSERT INTO Staff_training (nurse_id, training_id, expiry_date, status)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE expiry_date = VALUES(expiry_date), status = VALUES(status)
                    `, [nId, programIds[course], expiry, status]);
                }
            }
        }

        // 5. Seed Trainees
        console.log("Inserting Trainees...");
        for (const t of trainees) {
            const [existing] = await conn.query("SELECT trainee_id FROM Trainee WHERE full_name = ?", [t.name]);
            if (existing.length === 0) {
                await conn.query(
                    "INSERT INTO Trainee (full_name, university, training_type, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                    [t.name, t.uni, t.type, new Date(), new Date(Date.now() + 90*24*60*60*1000)]
                );
            }
        }

        console.log("Seeding complete! ✨");
    } catch (err) {
        console.error("Seeding Error:", err);
    } finally {
        await conn.end();
    }
}

setup();
