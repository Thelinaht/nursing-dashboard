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
    // Check if the user is a Director (role_id = 4)
    const [userRole] = await pool.query("SELECT role_id FROM UserRole WHERE user_id = ?", [userId]);
    if (userRole.length > 0 && userRole[0].role_id === 4) {
      // Check if Priority Alerts have been seeded already
      const [existingAlerts] = await pool.query("SELECT * FROM Notification WHERE user_id = ? AND category = 'Priority Alert'", [userId]);
      if (existingAlerts.length === 0) {
        const priorityAlerts = [
          { title: "SICU license expiry approaching (3 days)", message: "The license for SICU is expiring in 3 days. Action is required.", notification_type: "error", priority: "critical" },
          { title: "ER staffing low on Night Shift", message: "Emergency Room staffing levels are dangerously low for the upcoming night shift.", notification_type: "warning", priority: "high" },
          { title: "Training overdue for 14 staff", message: "14 staff members have overdue compliance training modules.", notification_type: "warning", priority: "high" },
          { title: "Unusual overtime requested in Pediatric Unit", message: "Pediatric unit has submitted an unusually high request for overtime hours.", notification_type: "info", priority: "medium" },
          { title: "Missing documents for 3 new orientees", message: "HR documents are missing for 3 newly joined orientees.", notification_type: "info", priority: "medium" },
          { title: "Patient satisfaction dropped below 85% in Oncology", message: "Oncology unit patient satisfaction rating has dropped below the target of 85%.", notification_type: "error", priority: "critical" },
          { title: "System maintenance scheduled for tonight", message: "Routine system maintenance is scheduled from 2:00 AM to 4:00 AM tonight.", notification_type: "info", priority: "low" },
          { title: "Equipment malfunction reported in OR-3", message: "An equipment malfunction has been reported and logged for Operating Room 3.", notification_type: "warning", priority: "high" },
          { title: "Nurse 'Ahmad' leave request pending for 5 days", message: "A leave request submitted by Ahmad has been pending supervisor approval for 5 days.", notification_type: "info", priority: "medium" },
          { title: "Mandatory Fire Safety training compliance at 60%", message: "Fire Safety training compliance is currently at 60%, below the required 95% standard.", notification_type: "warning", priority: "high" },
          { title: "Monthly quality report ready for review", message: "The monthly nursing quality index report is ready for Director review.", notification_type: "info", priority: "low" },
          { title: "Multiple shift swaps requested for Eid holiday", message: "High volume of shift swap requests received for the upcoming Eid holiday shift.", notification_type: "info", priority: "medium" },
          { title: "Code Blue response time exceeded 3 minutes", message: "A Code Blue response time incident has exceeded the 3-minute benchmark.", notification_type: "error", priority: "critical" }
        ];

        for (const alert of priorityAlerts) {
          await pool.query(
            "INSERT INTO Notification (user_id, title, message, notification_type, priority, category) VALUES (?, ?, ?, ?, ?, 'Priority Alert')",
            [userId, alert.title, alert.message, alert.notification_type, alert.priority]
          );
        }
      }
    }

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
