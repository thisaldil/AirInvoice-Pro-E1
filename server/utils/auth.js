const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "token";
const OAUTH_STATE_COOKIE_NAME = "airinvoice.oauth_state";
const JWT_ISSUER = "air-invoice-api";
const JWT_AUDIENCE = "air-invoice-client";
const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";

const assertJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  if (isProduction && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }

  if (!isProduction && process.env.JWT_SECRET.length < 32) {
    console.warn("JWT_SECRET should contain at least 32 characters");
  }
};

const authCookieOptions = (includeMaxAge = true) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  priority: "high",
  ...(includeMaxAge ? { maxAge: AUTH_COOKIE_MAX_AGE_MS } : {}),
});

const oauthStateCookieOptions = (includeMaxAge = true) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth/google",
  priority: "high",
  ...(includeMaxAge ? { maxAge: OAUTH_STATE_MAX_AGE_MS } : {}),
});

const signAuthToken = (user) => {
  assertJwtSecret();

  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      expiresIn: "24h",
    }
  );
};

const verifyAuthToken = (token) => {
  assertJwtSecret();

  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  });
};

const setAuthCookie = (res, user) => {
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(user), authCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions(false));
};

module.exports = {
  AUTH_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  authCookieOptions,
  oauthStateCookieOptions,
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  assertJwtSecret,
  isProduction,
};
