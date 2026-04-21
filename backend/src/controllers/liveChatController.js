const liveChatModel = require("../models/liveChatModel");
const db = require("../db");

async function getHistory(req, res) {
    try {
        const { user1, user2 } = req.params;
        const history = await liveChatModel.getChatHistory(user1, user2);
        res.json(history);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
}

async function getContacts(req, res) {
    try {
        const { userId } = req.params;
        // Fetch all active users, join staff details, roles, and get the last message timestamp for sorting
        const [rows] = await db.query(`
            SELECT 
                u.user_id, 
                COALESCE(ns.full_name, u.email) as full_name, 
                COALESCE(ns.job_title, r.role_name) as job_title, 
                COALESCE(ns.unit, 'Management') as unit, 
                r.role_name as role,
                COALESCE(
                    (SELECT MAX(timestamp) 
                     FROM messages 
                     WHERE (sender_id = u.user_id AND recipient_id = ?) 
                        OR (sender_id = ? AND recipient_id = u.user_id)
                    ), 
                    '1970-01-01 00:00:00'
                ) as last_msg_at
            FROM User u
            LEFT JOIN Nursing_staff ns ON u.user_id = ns.user_id
            LEFT JOIN UserRole ur ON u.user_id = ur.user_id
            LEFT JOIN Role r ON ur.role_id = r.role_id
            WHERE u.account_status = 'Active'
            ORDER BY last_msg_at DESC
        `, [userId, userId]);
        
        res.json(rows);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
}

async function saveMsg(req, res) {
    try {
        const { sender_id, recipient_id, content } = req.body;
        const insertId = await liveChatModel.saveMessage(sender_id, recipient_id, content);
        res.json({ message_id: insertId, success: true });
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Failed to save message" });
    }
}

module.exports = {
    getHistory,
    getContacts,
    saveMsg
};
