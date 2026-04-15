const express = require("express");
const router = express.Router();
const controller = require("../controllers/miscController");

router.get("/:id", controller.getByUser);
router.post(
    "/file/:userId/:miscTypeId",
    controller.upload.single("file"),
    controller.uploadFile
);
router.delete("/file/:userId/:docId", controller.deleteFile);

module.exports = router;