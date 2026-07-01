const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, select: false },
    googleId: { type: String },
    picture: { type: String },
    tokenVersion: { type: Number, default: 0, select: false },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    verifyotp: { type: String, default: "", select: false },
    verifyotpExpireat: { type: Number, default: 0, select: false },
    verifyotpAttempts: { type: Number, default: 0, select: false },
    verifyotpLastSentAt: { type: Date, select: false },
    isAccountVerified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0, select: false },
    loginLockedUntil: { type: Date, select: false },
    resetOtp: { type: String, default: "", select: false },
    resetOtpExpireAt: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.index(
  { googleId: 1 },
  {
    name: "googleId_1",
    unique: true,
    partialFilterExpression: { googleId: { $type: "string" } },
  }
);

module.exports = mongoose.model("User", userSchema);
