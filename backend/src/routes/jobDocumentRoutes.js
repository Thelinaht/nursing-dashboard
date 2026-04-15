const express = require("express");
const router = express.Router();
const controller = require("../controllers/jobDocumentController");

router.get("/:id", controller.getByUser);
router.put("/", controller.upsert);
router.post(
    "/file/:userId/:docTypeId",
    controller.upload.single("file"),
    controller.uploadFile
);

module.exports = router;