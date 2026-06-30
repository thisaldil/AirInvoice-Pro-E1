const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, required: true},
    verifyotp: { type: Number, default:" "},
    verifyotpExpireat: { type: Number, default:0},
isAccountVerified: { type: Boolean, default: false },
resetOtp: { type: String, default: "" },
resetOtpExpireAt: { type: Number, default: 0 },  
},
  { timestamps: true }
);

module.exports = mongoose.model("Usermodel", userSchema,"google_users");
