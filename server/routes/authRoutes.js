const express = require("express");
const passport = require("passport");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

const usernameRules = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),
];

const emailRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
];

const passwordRules = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
];

router.post(
  "/register",
  [
    ...usernameRules,
    ...emailRules,
    ...passwordRules,
    body("name").optional().trim().isLength({ max: 80 }).withMessage("Name is too long"),
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("usernameOrEmail").trim().notEmpty().withMessage("Username or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentUser);
router.put(
  "/profile",
  requireAuth,
  [
    body("name").optional().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers and underscores"),
    body("email").optional().trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    body("picture").optional().trim().isURL().withMessage("Picture must be a valid URL"),
  ],
  authController.updateProfile
);
router.put(
  "/password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("New password must contain an uppercase letter")
      .matches(/[a-z]/)
      .withMessage("New password must contain a lowercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain a number"),
  ],
  authController.changePassword
);
router.delete("/account", requireAuth, authController.deleteAccount);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  authController.handleGoogleRedirect
);

router.post("/google/callback", authController.handleGoogleToken);

router.post("/google/register", authController.handleGoogleRegister);

module.exports = router;
