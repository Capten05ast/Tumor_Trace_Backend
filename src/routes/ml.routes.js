

const express = require("express");
const router = express.Router();

const { saveMLResult } = require("../controllers/ML.controller");
const { authUser } = require("../middlewares/auth.middleware");
const mlController = require("../controllers/ML.controller");

router.post("/ml/result", authUser, saveMLResult);
router.post("/ml/classification", authUser, mlController.saveTumorClassification);

module.exports = router;


