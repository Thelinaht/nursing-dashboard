const pool = require("../db");

/* ========== PROJECTS ========== */
exports.getAllProjects = async () => {
    const [rows] = await pool.query("SELECT * FROM Research_project ORDER BY start_date DESC");
    return rows;
};

exports.createProject = async ({ title, status, start_date, investigator_name }) => {
    const [result] = await pool.query(
        `INSERT INTO Research_project (title, status, start_date, investigator_name)
         VALUES (?, ?, ?, ?)`,
        [title, status, start_date || null, investigator_name || null]
    );
    return result.insertId;
};

exports.updateProject = async (id, { title, status, start_date, investigator_name }) => {
    const [result] = await pool.query(
        `UPDATE Research_project
         SET title = ?, status = ?, start_date = ?, investigator_name = ?
         WHERE project_id = ?`,
        [title, status, start_date || null, investigator_name || null, id]
    );
    return result.affectedRows;
};

/* ========== PUBLICATIONS ========== */
exports.getAllPublications = async () => {
    const [rows] = await pool.query("SELECT * FROM Publication ORDER BY date DESC");
    return rows;
};

exports.getPublicationById = async (id) => {
    const [rows] = await pool.query("SELECT * FROM Publication WHERE publication_id = ?", [id]);
    return rows[0];
};

exports.createPublication = async ({ title, author_name, type, date, journal_name, PublishedFile_path }) => {
    const [result] = await pool.query(
        `INSERT INTO Publication (title, author_name, type, date, journal_name, PublishedFile_path)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, author_name || null, type || null, date || null, journal_name || null, PublishedFile_path || null]
    );
    return result.insertId;
};

exports.updatePublication = async (id, { title, author_name, type, date, journal_name, PublishedFile_path }) => {
    // If PublishedFile_path is undefined, do not overwrite existing file
    let query, params;
    if (PublishedFile_path !== undefined) {
        query = `UPDATE Publication SET title = ?, author_name = ?, type = ?, date = ?, journal_name = ?, PublishedFile_path = ? WHERE publication_id = ?`;
        params = [title, author_name || null, type || null, date || null, journal_name || null, PublishedFile_path, id];
    } else {
        query = `UPDATE Publication SET title = ?, author_name = ?, type = ?, date = ?, journal_name = ? WHERE publication_id = ?`;
        params = [title, author_name || null, type || null, date || null, journal_name || null, id];
    }
    const [result] = await pool.query(query, params);
    return result.affectedRows;
};