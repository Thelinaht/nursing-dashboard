const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const competencies = [
    // --- Missing General Competencies ---
    { name: "Clinical Alarm System", category: "Competency", unit: "General", mandatory: 0 },
    { name: "Hospital Information System", category: "Competency", unit: "General", mandatory: 0 },
    { name: "Prevention of Surgical Site Infection", category: "Competency", unit: "General", mandatory: 0 },
    { name: "Compounding Sterile Preparation", category: "Competency", unit: "General", mandatory: 0 },
    { name: "Moderate and Deep Sedation", category: "Competency", unit: "General", mandatory: 0 },

    // --- Medical/Surgical ---
    { name: "Orthopedic Care", category: "Competency", unit: "Medical/Surgical", mandatory: 0 },
    { name: "Care of EVD", category: "Competency", unit: "Medical/Surgical", mandatory: 0 },
    { name: "Pre & Post-Operative Care", category: "Competency", unit: "Medical/Surgical", mandatory: 0 },
    { name: "Care of Chemotherapy", category: "Competency", unit: "Medical/Surgical", mandatory: 0 },

    // --- Critical Care ---
    { name: "Arterial Blood Gas Collection", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Basic Cardiac Monitoring", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Closed Chest Drainage System", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Central Venous Device", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Completing & Interpreting 12 Lead ECG", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Defibrillation", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care & Management of Mechanical Ventilation", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Critically Ill Patients", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Patient on CRRT", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "End-of-Life Care", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Medication Administration - Neonates", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Umbilical Catheterization", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Phototherapy", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Newborn Hearing Test", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Sheath Removal", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Transcutaneous Pacing", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Transvenous Pacing Competency", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Neonatal Exchange Transfusion", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Newborn in Incubator", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Endotracheal Tube", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Care of Patient with Tracheostomy", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Assessing Glasgow Coma Scale", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Assessment of Patient Using Sarnat & Thompson Scoring", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Immediate Care of Newborn", category: "Competency", unit: "Critical Care", mandatory: 0 },
    { name: "Preparing & Assisting TAVI", category: "Competency", unit: "Critical Care", mandatory: 0 },

    // --- Pediatric ---
    { name: "Medication Administration - Pediatrics", category: "Competency", unit: "Pediatric", mandatory: 0 },
    { name: "Developmental Screening", category: "Competency", unit: "Pediatric", mandatory: 0 },
    { name: "Growth Hormone Study", category: "Competency", unit: "Pediatric", mandatory: 0 },
    { name: "Sweat Chloride Test", category: "Competency", unit: "Pediatric", mandatory: 0 },

    // --- OB GYN & Delivery Room ---
    { name: "Antenatal Assessment", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Fetal Heart Monitoring", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Assessment During Labor", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Breastfeeding", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Care of Post-Partum Hemorrhage", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Conducting Emergency Normal Delivery", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },
    { name: "Administration of Nitrous Oxide Analgesia", category: "Competency", unit: "OB GYN & Delivery Room", mandatory: 0 },

    // --- Emergency Room ---
    { name: "Triage", category: "Competency", unit: "Emergency Room", mandatory: 0 },
    { name: "EMS Secondary Assessment", category: "Competency", unit: "Emergency Room", mandatory: 0 },
    { name: "Shock Management", category: "Competency", unit: "Emergency Room", mandatory: 0 },
    { name: "Care of Trauma Patient", category: "Competency", unit: "Emergency Room", mandatory: 0 },

    // --- Dialysis Unit ---
    { name: "Air Embolism", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Vascular Access", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Peritoneal Dialysis Access", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Peritoneal Dialysis Procedure", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Hemodialysis Procedure", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Anticoagulation", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Management of Clotting", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Care of AV Fistular & AV Graft", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Care of Patient with Hyperkalemia", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },
    { name: "Care of Tunneled & Non-Tunneled Catheters", category: "Competency", unit: "Dialysis Unit", mandatory: 0 },

    // --- OR / DS / Endoscopy ---
    { name: "Age Related Pneumatic Tourniquet Devices", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Age Related Warming Device", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Electro-Surgical Use & Safety", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Laser Safety", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Moving & Positioning of Patient", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Assisting in Operations of Specialty Surgical", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Draping & Gowning", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Maintenance of a Sterile Field", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Handling & Disposing of Surgical Equipment", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Safe Operation of Variable Surgical Equipment", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Surgical Table Operation & Safe Patient Positioning", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Use of Equipment", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },
    { name: "Post Operative Care in PACU", category: "Competency", unit: "OR / DS / Endoscopy", mandatory: 0 },

    // --- Psychiatry ---
    { name: "Management of Violent Patient", category: "Competency", unit: "Psychiatry", mandatory: 0 },
    { name: "Therapeutic Immobilization", category: "Competency", unit: "Psychiatry", mandatory: 0 },
    { name: "Pre & Post ECT", category: "Competency", unit: "Psychiatry", mandatory: 0 },

    // --- OPD ---
    { name: "Immunization", category: "Competency", unit: "OPD", mandatory: 0 },
    { name: "Liquid Nitrogen", category: "Competency", unit: "OPD", mandatory: 0 },
    { name: "Ultraviolet", category: "Competency", unit: "OPD", mandatory: 0 },

    // --- CSSD ---
    { name: "Cleaning & Decontamination", category: "Competency", unit: "CSSD", mandatory: 0 },
    { name: "Moving & Handling of Heavy Instruments", category: "Competency", unit: "CSSD", mandatory: 0 },
    { name: "Packing Sterilization and Storage", category: "Competency", unit: "CSSD", mandatory: 0 },

    // --- Nursing Management ---
    { name: "Clinical Nursing Supervisor", category: "Competency", unit: "Nursing Management", mandatory: 0 },
    { name: "Off-Shift Nursing Supervisor", category: "Competency", unit: "Nursing Management", mandatory: 0 },
    { name: "Head Nurse", category: "Competency", unit: "Nursing Management", mandatory: 0 },

    // --- Pediatric Hemodialysis ---
    { name: "Hemodialysis Procedure in Pediatric", category: "Competency", unit: "Pediatric Hemodialysis", mandatory: 0 },
    { name: "Pediatric Anticoagulation", category: "Competency", unit: "Pediatric Hemodialysis", mandatory: 0 },
    { name: "Management of Clotting in Pediatric", category: "Competency", unit: "Pediatric Hemodialysis", mandatory: 0 },
    { name: "CRRT in Pediatric", category: "Competency", unit: "Pediatric Hemodialysis", mandatory: 0 }
];

async function seed() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306)
    });

    console.log("Connected to Railway DB. Seeding missing clinical competencies...");

    try {
        let inserted = 0;
        let skipped = 0;

        for (const comp of competencies) {
            // Check if training already exists by name
            const [existing] = await conn.query("SELECT training_id FROM Training_program WHERE training_name = ?", [comp.name]);
            if (existing.length > 0) {
                // If it exists, update category and unit just to be sure
                await conn.query(
                    "UPDATE Training_program SET training_category = ?, unit_of_training = ?, mandatory = ? WHERE training_name = ?",
                    [comp.category, comp.unit, comp.mandatory, comp.name]
                );
                skipped++;
            } else {
                // Insert new program
                await conn.query(
                    "INSERT INTO Training_program (training_name, training_category, unit_of_training, mandatory, description) VALUES (?, ?, ?, ?, ?)",
                    [comp.name, comp.category, comp.unit, comp.mandatory, `Clinical checklist competency item for ${comp.unit}`]
                );
                inserted++;
            }
        }

        console.log(`Seeding complete. New inserted: ${inserted}, Updated/Skipped: ${skipped}`);
    } catch (err) {
        console.error("Error during seeding:", err);
    } finally {
        await conn.end();
    }
}

seed();
