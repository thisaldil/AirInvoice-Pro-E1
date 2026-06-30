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
    token: { type: String, select: false },
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
    verifyotp: { type: String, default: "" },
    verifyotpExpireat: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
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
