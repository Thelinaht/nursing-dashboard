const pool = require("../db");

/**
 * Internal function to create a notification
 * @param {Object} data - { user_id, title, message, notification_type, priority, category }

 * @param {Object} io - Optional socket.io instance for real-time delivery
 */
const createNotification = async (data, io = null) => {
  const { user_id, title, message, notification_type = "info", priority = "medium", category = "System" } = data;
  try {
    await pool.query(
      "INSERT INTO Notification (user_id, title, message, notification_type, priority, category) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, title, message, notification_type, priority, category]
    );


    // Real-time push if io is provided
    if (io) {
      io.to(`user_${user_id}`).emit("new_notification", {
        ...data,
        is_read: 0,
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

/**
 * Get all notifications for a specific user
 */
const getUserNotifications = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    let query = "SELECT * FROM Notification WHERE user_id = ?";
    const params = [userId];

    if (type && type.toLowerCase() !== 'all') {
      query += " AND notification_type = ?";
      params.push(type.toLowerCase());
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Mark a specific notification as read
 */
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE Notification SET is_read = 1 WHERE notification_id = ?",
      [notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read for a specific user
 */
const markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query(
      "UPDATE Notification SET is_read = 1 WHERE user_id = ?",
      [userId]
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
