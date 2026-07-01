const express = require("express");
const cloudinaryController = require("../controllers/cloudinaryController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.post("/signature", cloudinaryController.createSignature);
router.post("/assets", cloudinaryController.registerAsset);
router.get("/assets", cloudinaryController.listAssets);
router.get("/assets/:id", cloudinaryController.getAsset);
router.delete("/assets/:id", cloudinaryController.deleteAsset);

module.exports = router;
