const express = require("express");
const router = express.Router();

const controller = require("../controllers/requestsController");

router.get("/", controller.getAll);
router.get("/nurse/:nurse_id", controller.getByNurseId);
router.get("/:id", controller.getOne);
router.post("/", controller.create);


router.put("/:id/status", controller.updateStatus);

router.delete("/:id", controller.remove);

module.exports = router;