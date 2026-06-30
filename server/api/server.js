require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const connectDB = require("../database");

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// ---- CORS setup (single source of truth) ----
const allowedOrigins = [
  "https://air-invoice-client.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---- Core middleware (MUST come before routes) ----
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    name: "airinvoice.sid",
    secret:
      process.env.SESSION_SECRET ||
      process.env.JWT_SECRET ||
      "airinvoice-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ---- Models & passport strategy ----
require("../models/User");
require("../services/passport");

// ---- Routes (mounted once, after middleware) ----
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const templateRoutes = require("../routes/templateRoutes");
const invoiceRoutes = require("../routes/invoiceRoutes");
const ocrRoutes = require("../routes/ocrRoutes");

app.use("/api/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/template", templateRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/ocr", ocrRoutes);

// ---- Cloudinary signature endpoint ----
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

app.post("/generate-signature", (req, res) => {
  try {
    const { timestamp } = req.body;
    if (!timestamp) {
      return res.status(400).json({ error: "Timestamp is required" });
    }
    const signature = crypto
      .createHash("sha1")
      .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest("hex");
    res.json({ signature });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- DB connection & server start (for local dev) ----
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log("Server Start on " + port);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;