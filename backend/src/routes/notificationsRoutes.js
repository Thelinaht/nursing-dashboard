const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Fetch notifications for a user
router.get("/user/:userId", notificationController.getUserNotifications);

// Mark a single notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// Mark all notifications as read for a user
router.patch("/user/:userId/read-all", notificationController.markAllAsRead);

module.exports = router;
