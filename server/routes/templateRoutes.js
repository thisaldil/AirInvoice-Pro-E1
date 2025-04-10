const express = require('express');
const router = express.Router();
const templateController = require("../controllers/templateController.js");


router.post("/createTemplate", templateController.createTemplate);

module.exports = router;
