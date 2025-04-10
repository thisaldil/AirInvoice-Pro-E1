const express = require('express');
const router = express.Router();
const templateController = require("../controllers/templateController.js");


router.post("/createTemplate", templateController.createTemplate);
router.get("/getTemplates/:userId", templateController.getTemplates);
router.get("/getTemplateById/:id", templateController.getTemplateById);
router.put("/updateTemplate/:id", templateController.updateTemplate);
router.delete("/deleteTemplate/:id", templateController.deleteTemplate);

module.exports = router;
