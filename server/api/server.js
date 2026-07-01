require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const connectDB = require("../database");
const {
  AUTH_COOKIE_NAME,
  assertJwtSecret,
  isProduction,
} = require("../utils/auth");

const app = express();
assertJwtSecret();

// ---- CORS setup (single source of truth) ----
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, "");
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://air-invoice-client.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL ? [normalizeOrigin(process.env.CLIENT_URL)] : []),
  ...configuredOrigins,
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    const error = new Error("Origin is not allowed");
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---- Core middleware (MUST come before routes) ----
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Cookie-authenticated writes must originate from an explicitly allowed frontend.
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = normalizeOrigin(req.get("origin"));
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ message: "Invalid request origin" });
  }

  if (req.cookies?.[AUTH_COOKIE_NAME] && !origin) {
    return res.status(403).json({ message: "Request origin is required" });
  }

  return next();
});

app.use(passport.initialize());

// ---- Models & passport strategy ----
require("../models/User");
require("../services/passport");

// ---- Routes (mounted once, after middleware) ----
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const templateRoutes = require("../routes/templateRoutes");
const invoiceRoutes = require("../routes/invoiceRoutes");
const ocrRoutes = require("../routes/ocrRoutes");
const cloudinaryRoutes = require("../routes/cloudinaryRoutes");

app.use("/api/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/template", templateRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/ocr", ocrRoutes);
app.use("/cloudinary", cloudinaryRoutes);

// ---- DB connection & server start (for local dev) ----
connectDB().catch((err) => {
  console.error("MongoDB connection error:", err);
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  return res.status(err.status || 500).json({
    message: err.status === 403 ? err.message : "Internal Server Error",
  });
});

module.exports = app;
