const pool = require("../db");

// Strips to plain YYYY-MM-DD for MySQL DATE columns
const toDateOnly = (val) => {
    if (!val) return null;
    return String(val).split("T")[0];
};

// Formats for MySQL DATETIME — replaces T with space
const toDatetime = (val) => {
    if (!val) return null;
    return String(val).replace("T", " ").slice(0, 19);
};

// Formats a mysql2 Date object back to "YYYY-MM-DDTHH:MM"
// Uses LOCAL time methods so the stored value is preserved correctly
const fromMySQLDatetime = (d) => {
    if (!d) return null;
    if (!(d instanceof Date)) {
        // Already a string — just normalize it
        return String(d).replace(" ", "T").slice(0, 16);
    }
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ============================================================
// FALLS — Quality_FI
// ============================================================

exports.getAllFalls = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM Quality_FI ORDER BY IncidentDate DESC"
    );
    return rows;
};

exports.createFall = async (data) => {
    const {
        ReferenceID, URN, IncidentDate, TimeofFI, Age, Gender,
        Location, IncidentSubLocation, InjurySustained, Fall,
        ContributoryFactors, Description
    } = data;

    const [result] = await pool.query(
        `INSERT INTO Quality_FI
         (ReferenceID, URN, IncidentDate, TimeofFI, Age, Gender,
          Location, IncidentSubLocation, InjurySustained, \`Fall\`,
          ContributoryFactors, Description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ReferenceID || null,
            URN || null,
            toDateOnly(IncidentDate),
            TimeofFI || null,
            Age || null,
            Gender || null,
            Location || null,
            IncidentSubLocation || null,
            InjurySustained || null,
            Fall || null,
            ContributoryFactors || null,
            Description || null
        ]
    );
    return result;
};

exports.updateFall = async (id, data) => {
    const {
        URN, IncidentDate, TimeofFI, Age, Gender,
        Location, IncidentSubLocation, InjurySustained, Fall,
        ContributoryFactors, Description
    } = data;

    const [result] = await pool.query(
        `UPDATE Quality_FI
         SET URN=?, IncidentDate=?, TimeofFI=?, Age=?, Gender=?,
             Location=?, IncidentSubLocation=?, InjurySustained=?, \`Fall\`=?,
             ContributoryFactors=?, Description=?
         WHERE ReferenceID=?`,
        [
            URN || null,
            toDateOnly(IncidentDate),
            TimeofFI || null,
            Age || null,
            Gender || null,
            Location || null,
            IncidentSubLocation || null,
            InjurySustained || null,
            Fall || null,
            ContributoryFactors || null,
            Description || null,
            id
        ]
    );
    return result;
};

exports.deleteFall = async (id) => {
    const [result] = await pool.query(
        "DELETE FROM Quality_FI WHERE ReferenceID=?", [id]
    );
    return result;
};

// ============================================================
// HAPI — Quality_HAPI
// ============================================================

exports.getAllHapi = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM Quality_HAPI ORDER BY IncidentDate DESC"
    );
    // Normalize IncidentDate: convert mysql2 Date objects to plain
    // "YYYY-MM-DDTHH:MM" strings using UTC methods so the stored value
    // is preserved without any timezone shift
    return rows.map(row => ({
        ...row,
        IncidentDate: fromMySQLDatetime(row.IncidentDate)
    }));
};

exports.createHapi = async (data) => {
    const {
        ReferenceID, URN, IncidentDate, IncidentSubLocation,
        Stage, AffectedSite, ContributoryFactors, Description
    } = data;

    const [result] = await pool.query(
        `INSERT INTO Quality_HAPI
         (ReferenceID, URN, IncidentDate, IncidentSubLocation,
          Stage, AffectedSite, ContributoryFactors, Description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ReferenceID || null,
            URN || null,
            toDatetime(IncidentDate),
            IncidentSubLocation || null,
            Stage || null,
            AffectedSite || null,
            ContributoryFactors || null,
            Description || null
        ]
    );
    return result;
};

exports.updateHapi = async (id, data) => {
    const {
        URN, IncidentDate, IncidentSubLocation,
        Stage, AffectedSite, ContributoryFactors, Description
    } = data;

    const [result] = await pool.query(
        `UPDATE Quality_HAPI
         SET URN=?, IncidentDate=?, IncidentSubLocation=?,
             Stage=?, AffectedSite=?, ContributoryFactors=?, Description=?
         WHERE ReferenceID=?`,
        [
            URN || null,
            toDatetime(IncidentDate),
            IncidentSubLocation || null,
            Stage || null,
            AffectedSite || null,
            ContributoryFactors || null,
            Description || null,
            id
        ]
    );
    return result;
};

exports.deleteHapi = async (id) => {
    const [result] = await pool.query(
        "DELETE FROM Quality_HAPI WHERE ReferenceID=?", [id]
    );
    return result;
};

// ============================================================
// MEDICATION — Quality_Medication
// ============================================================

exports.getAllMeds = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM Quality_Medication ORDER BY Date DESC"
    );
    return rows.map(row => ({
        ...row,
        Date: fromMySQLDatetime(row.Date)
    }));
};

exports.createMed = async (data) => {
    const { URN, Date: MedDate, Unit, Type, Description } = data;
    const [result] = await pool.query(
        `INSERT INTO Quality_Medication (URN, Date, Unit, Type, Description)
         VALUES (?, ?, ?, ?, ?)`,
        [URN || null, toDatetime(MedDate), Unit || null, Type || null, Description || null]
    );
    return result;
};

exports.updateMed = async (urn, data) => {
    const { Date: MedDate, Unit, Type, Description } = data;
    const [result] = await pool.query(
        `UPDATE Quality_Medication SET Date=?, Unit=?, Type=?, Description=? WHERE URN=?`,
        [toDatetime(MedDate), Unit || null, Type || null, Description || null, urn]
    );
    return result;
};

exports.deleteMed = async (urn) => {
    const [result] = await pool.query(
        "DELETE FROM Quality_Medication WHERE URN=?", [urn]
    );
    return result;
};