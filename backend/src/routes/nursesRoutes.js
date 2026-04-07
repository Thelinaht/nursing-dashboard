const express = require("express");
const router = express.Router();

const nursesController = require("../controllers/nursesController");

// GET all
router.get("/", nursesController.getAll);

// GET one
router.get("/:id", nursesController.getOne);

// CREATE
router.post("/", nursesController.create);

// UPDATE
router.put("/:id", nursesController.update);

// DELETE
router.delete("/:id", nursesController.remove);

module.exports = router;