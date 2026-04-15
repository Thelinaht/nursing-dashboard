const express = require("express");
const router = express.Router();

const controller = require("../controllers/orientationController");

// GET all items + nurse records by user_id
router.get("/:id", controller.getByUser);

// UPSERT orientation record
router.put("/", controller.upsert);

// Upload file
router.post(
    "/file/:userId/:itemId",
    controller.upload.single("file"),
    controller.uploadFile
);

module.exports = router;