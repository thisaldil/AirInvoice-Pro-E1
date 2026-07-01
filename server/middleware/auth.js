const User = require("../models/User");
const {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  verifyAuthToken,
} = require("../utils/auth");

const publicUserSelect =
  "-password -tokenVersion -verifyotp -verifyotpExpireat -verifyotpAttempts " +
  "-verifyotpLastSentAt -loginAttempts -loginLockedUntil -resetOtp -resetOtpExpireAt -__v";

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return req.cookies?.[AUTH_COOKIE_NAME] || null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = verifyAuthToken(token);
    const user = await User.findById(decoded.sub).select(
      `${publicUserSelect} +tokenVersion`
    );

    if (
      !user ||
      !user.isActive ||
      (user.authProvider === "local" && !user.isAccountVerified) ||
      decoded.tokenVersion !== (user.tokenVersion || 0)
    ) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    req.userId = user._id.toString();
    return next();
  } catch (error) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Authentication required" });
  }
};

module.exports = {
  requireAuth,
  publicUserSelect,
};
