const pool = require("../db");

const getAllRoles = async () => {
    const [rows] = await pool.query("SELECT * FROM Role");
    return rows;
};

module.exports = {
    getAllRoles
};