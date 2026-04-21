const express = require("express");
const liveChatController = require("../controllers/liveChatController");

const router = express.Router();

router.get("/history/:user1/:user2", liveChatController.getHistory);
router.get("/contacts/:userId", liveChatController.getContacts);
router.post("/send", liveChatController.saveMsg);

module.exports = router;
