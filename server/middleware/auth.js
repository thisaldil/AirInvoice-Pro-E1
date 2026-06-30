const jwt = require("jsonwebtoken");
const User = require("../models/User");

const publicUserSelect = "-password -token -__v";

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return req.cookies?.token || null;
};

const requireAuth = async (req, res, next) => {
  try {
    let userId = req.session?.userId;

    if (!userId) {
      const token = getTokenFromRequest(req);
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      }
    }

    if (!userId && req.isAuthenticated?.() && req.user?._id) {
      userId = req.user._id;
    }

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId).select(publicUserSelect);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    req.userId = user._id.toString();
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication required" });
  }
};

module.exports = {
  requireAuth,
  publicUserSelect,
};
