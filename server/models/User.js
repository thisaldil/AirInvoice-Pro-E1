const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
