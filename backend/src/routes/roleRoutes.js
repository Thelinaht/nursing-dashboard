const express = require("express");
const { getRoles } = require("../controllers/roleController");

const router = express.Router();

router.get("/", getRoles);

module.exports = router;