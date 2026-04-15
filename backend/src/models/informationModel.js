const pool = require("../db");

// GET by user_id
exports.getById = async (id) => {
    const [rows] = await pool.query(
        "SELECT * FROM Nursing_staff WHERE user_id = ?",
        [id]
    );
    return rows[0];
};

// UPDATE by user_id
exports.updateById = async (id, data) => {
    const allowedFields = [
        "full_name", "first_name", "middle_name", "last_name",
        "national_id_iqama", "hospital_id_number", "payroll_number",
        "track_care_number", "gender", "nationality",
        "birth_date_gregorian", "birth_date_hijri",
        "mobile_number", "iau_email", "unit", "department",
        "job_title", "position_title", "qualification", "license_number",
        "status", "hire_date", "years_of_experience", "shift_type",
        "contract_type", "contract_date_gregorian", "contract_date_hijri",
        "preferred_area_first_choice", "preferred_area_second_choice",
        // document paths (updated via upload endpoint, but allowed here too)
        "cv_path", "hospital_id_path", "national_id_path",
        "passport_path", "picture_path"
    ];

    const filteredData = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            const dateFields = [
                "birth_date_gregorian", "birth_date_hijri",
                "contract_date_gregorian", "contract_date_hijri",
                "hire_date"
            ];
            filteredData[field] = (dateFields.includes(field) && data[field] === "")
                ? null
                : data[field];
        }
    }

    if (Object.keys(filteredData).length === 0) {
        return { affectedRows: 0, message: "No valid fields to update" };
    }

    const [result] = await pool.query(
        `UPDATE Nursing_staff SET ? WHERE user_id = ?`,
        [filteredData, id]
    );
    return result;
};