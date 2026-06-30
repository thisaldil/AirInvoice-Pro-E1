const express = require('express');
const router = express.Router();
const templateController = require("../controllers/templateController.js");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.post("/createTemplate", templateController.createTemplate);
router.get("/getTemplates", templateController.getTemplates);
router.get("/getTemplates/:userId", templateController.getTemplates);
router.get("/getTemplateById/:id", templateController.getTemplateById);
router.put("/updateTemplate/:id", templateController.updateTemplate);
router.delete("/deleteTemplate/:id", templateController.deleteTemplate);

module.exports = router;
