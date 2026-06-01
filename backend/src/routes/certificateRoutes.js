const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/certificateController");

router.get("/nurse/:userId", ctrl.getByUser);
router.put("/nurse/:userId/:typeId", ctrl.upsert);
router.post("/nurse/:userId/:typeId/upload", ctrl.upload.single("file"), ctrl.uploadFile);

module.exports = router;