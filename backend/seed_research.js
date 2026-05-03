const pool = require('./src/db');

async function run() {
  try {
    // 1. Add column to Research_project
    try {
        await pool.query('ALTER TABLE Research_project ADD COLUMN investigator_name VARCHAR(100)');
        console.log('Added investigator_name to Research_project');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('investigator_name already exists.');
        } else {
            throw e;
        }
    }

    // 2. Create Publication table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS Publication (
            publication_id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author_name VARCHAR(150),
            type VARCHAR(50),
            date DATE,
            journal_name VARCHAR(200)
        )
    `);
    console.log('Publication table ready.');

    // 3. Seed Research_project
    const [existingProjects] = await pool.query('SELECT COUNT(*) as count FROM Research_project');
    if (existingProjects[0].count === 0) {
        await pool.query(`
            INSERT INTO Research_project (title, investigator_name, start_date, status) VALUES 
            ('Impact of Nurse-to-Patient Ratio on Outcomes', 'Dr. Sarah Smith', '2025-01-15', 'Active'),
            ('Efficacy of new Hand Hygiene Protocol', 'Nurse John Doe', '2024-06-10', 'Completed'),
            ('Patient Satisfaction in ER Triage', 'Dr. Ahmed Al-Ali', '2025-03-01', 'Active'),
            ('Burnout among ICU Staff', 'Dr. Lisa Wong', '2023-11-20', 'On Hold')
        `);
        console.log('Seeded Research_project.');
    } else {
        console.log('Research_project already has data.');
    }

    // 4. Seed Publication
    const [existingPubs] = await pool.query('SELECT COUNT(*) as count FROM Publication');
    if (existingPubs[0].count === 0) {
        await pool.query(`
            INSERT INTO Publication (title, author_name, type, date, journal_name) VALUES 
            ('Improving Response Times in Trauma Centers', 'Dr. Ahmed Al-Ali', 'Article', '2026-02-15', 'Journal of Emergency Nursing'),
            ('Nurse Leadership During Pandemics', 'Dr. Sarah Smith', 'Presentation', '2025-11-10', 'Global Nursing Conference'),
            ('Evaluating Hand Hygiene Compliance', 'Nurse John Doe', 'Poster', '2024-09-05', 'Annual Infection Control Summit'),
            ('Advanced Cardiac Life Support Outcomes', 'Dr. Lisa Wong', 'Article', '2026-04-20', 'Cardiac Care Quarterly'),
            ('Telehealth in Rural Nursing', 'Dr. Sarah Smith', 'Article', '2025-12-01', 'Nursing Technology Journal')
        `);
        console.log('Seeded Publication.');
    } else {
        console.log('Publication already has data.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
