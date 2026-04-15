const express = require("express");
const router = express.Router();
const controller = require("../controllers/evaluationController");

router.get("/:id", controller.getByUser);
router.post(
    "/file/:userId/:evalTypeId",
    controller.upload.single("file"),
    controller.uploadFile
);

module.exports = router;