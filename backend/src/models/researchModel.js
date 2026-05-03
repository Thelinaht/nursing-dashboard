const pool = require("../db");

exports.getAllProjects = async () => {
    const [rows] = await pool.query("SELECT * FROM Research_project ORDER BY start_date DESC");
    return rows;
};

exports.getAllPublications = async () => {
    const [rows] = await pool.query("SELECT * FROM Publication ORDER BY date DESC");
    return rows;
};
