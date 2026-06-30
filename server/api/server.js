require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("../database");
const crypto = require("crypto");
const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(
  cors({
    origin: [
      "https://air-invoice-client.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    name: "airinvoice.sid",
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "airinvoice-dev-session-secret",
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

require("../models/User");
require("../services/passport");

const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const templateRoutes = require("../routes/templateRoutes");
const invoiceRoutes = require("../routes/invoiceRoutes");
const ocrRoutes = require("../routes/ocrRoutes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/template", templateRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/ocr", ocrRoutes);

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

connectDB().catch((err) => {
  console.error("MongoDB connection error:", err);
});

module.exports = app;
