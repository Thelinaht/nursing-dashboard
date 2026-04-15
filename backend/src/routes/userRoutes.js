const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// POST /api/users
router.post("/", userController.createUser);

// DELETE /api/users/:user_id
router.delete("/:user_id", userController.deleteUser);

module.exports = router;