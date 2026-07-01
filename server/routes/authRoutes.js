const express = require("express");
const passport = require("passport");
const crypto = require("crypto");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const {
  OAUTH_STATE_COOKIE_NAME,
  isProduction,
  oauthStateCookieOptions,
} = require("../utils/auth");
const router = express.Router();

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const clientUrl = (
  process.env.CLIENT_URL ||
  (isProduction
    ? "https://air-invoice-client.vercel.app"
    : "http://localhost:3000")
).replace(/\/$/, "");

const beginGoogleAuth = (req, res, next) => {
  const state = crypto.randomBytes(32).toString("base64url");
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, oauthStateCookieOptions());

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
};

const verifyGoogleState = (req, res, next) => {
  const expected = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  const received = typeof req.query.state === "string" ? req.query.state : "";
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, oauthStateCookieOptions(false));

  if (!expected || expected.length !== received.length) {
    return res.redirect(`${clientUrl}/login?error=invalid_oauth_state`);
  }

  const matches = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(received)
  );

  if (!matches) {
    return res.redirect(`${clientUrl}/login?error=invalid_oauth_state`);
  }

  return next();
};

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

router.post(
  "/verify-otp",
  [
    body("email").trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    body("otp")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
  ],
  authController.verifyOtp
);

router.post(
  "/resend-otp",
  [
    body("email").trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  ],
  authController.resendOtp
);

router.post("/logout", requireAuth, authController.logout);
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

router.get("/google", beginGoogleAuth);

router.get(
  "/google/callback",
  verifyGoogleState,
  passport.authenticate("google", {
    failureRedirect: `${clientUrl}/login?error=google_auth_failed`,
    session: false,
  }),
  authController.handleGoogleRedirect
);

router.post("/google/callback", authController.handleGoogleToken);

router.post("/google/register", authController.handleGoogleRegister);

module.exports = router;
