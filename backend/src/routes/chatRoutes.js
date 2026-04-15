const express = require("express");
const { sendChatMessage } = require("../controllers/chatController");

const router = express.Router();

router.post("/", sendChatMessage);

module.exports = router;