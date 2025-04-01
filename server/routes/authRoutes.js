const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  authController.handleGoogleRedirect
);

router.post("/google/callback", authController.handleGoogleToken);

router.post("/google/register", authController.handleGoogleRegister);

module.exports = router;