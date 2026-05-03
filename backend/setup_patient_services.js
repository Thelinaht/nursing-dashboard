const pool = require('./src/db');
const bcrypt = require('bcrypt');

async function setup() {
    try {
        console.log("Checking if role exists...");
        let [roles] = await pool.query("SELECT * FROM Role WHERE role_name = 'patient_services'");
        let roleId;

        if (roles.length === 0) {
            const [roleRes] = await pool.query("INSERT INTO Role (role_name) VALUES ('patient_services')");
            roleId = roleRes.insertId;
            console.log("Created role 'patient_services' with ID:", roleId);
        } else {
            roleId = roles[0].role_id;
            console.log("Role 'patient_services' already exists with ID:", roleId);
        }

        console.log("Checking if user exists...");
        const email = "PatientServices@iau.edu.sa";
        let [users] = await pool.query("SELECT * FROM User WHERE email = ?", [email]);
        let userId;

        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash("9876", 10);
            const [userRes] = await pool.query(
                "INSERT INTO User (email, password_hash) VALUES (?, ?)",
                [email, hashedPassword]
            );
            userId = userRes.insertId;
            console.log("Created user with ID:", userId);
        } else {
            userId = users[0].user_id;
            console.log("User already exists with ID:", userId);
        }

        console.log("Checking UserRole mapping...");
        let [userRoles] = await pool.query("SELECT * FROM UserRole WHERE user_id = ? AND role_id = ?", [userId, roleId]);
        if (userRoles.length === 0) {
            await pool.query("INSERT INTO UserRole (user_id, role_id) VALUES (?, ?)", [userId, roleId]);
            console.log("Created UserRole mapping.");
        } else {
            console.log("UserRole mapping already exists.");
        }

        console.log("Checking Nursing_staff profile...");
        let [staff] = await pool.query("SELECT * FROM Nursing_staff WHERE user_id = ?", [userId]);
        if (staff.length === 0) {
            await pool.query(
                "INSERT INTO Nursing_staff (user_id, full_name, iau_email) VALUES (?, ?, ?)",
                [userId, "Assistant Director of Nursing for Patient Services", email]
            );
            console.log("Created Nursing_staff profile.");
        } else {
            console.log("Nursing_staff profile already exists.");
        }

    } catch (err) {
        console.error("Error setting up patient services user:", err);
    } finally {
        pool.end();
    }
}

setup();
