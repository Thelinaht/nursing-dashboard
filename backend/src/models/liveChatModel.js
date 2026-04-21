const db = require("../db");

async function saveMessage(senderId, recipientId, content) {
    const [result] = await db.query(
        "INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)",
        [senderId, recipientId, content]
    );
    return result.insertId;
}

async function getChatHistory(userId1, userId2) {
    const [rows] = await db.query(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND recipient_id = ?) 
            OR (sender_id = ? AND recipient_id = ?) 
         ORDER BY timestamp ASC`,
        [userId1, userId2, userId2, userId1]
    );
    return rows;
}

async function getRecentChats(userId) {
    // This query gets unique users that the current user has chatted with
    const [rows] = await db.query(
        `SELECT DISTINCT 
            CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as other_user_id
         FROM messages 
         WHERE sender_id = ? OR recipient_id = ?`,
        [userId, userId, userId]
    );
    return rows;
}

module.exports = {
    saveMessage,
    getChatHistory,
    getRecentChats
};
