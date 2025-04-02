const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

//get user details
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password -__v");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        console.error("Error fetching user details:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

//send invoice email
exports.sendInvoiceEmail = async (req, res) => {
  const { email, invoiceDetails } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Valid recipient email is required" });
  }

  if (!invoiceDetails) {
    return res.status(400).json({ error: "Invoice details are required" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email.trim(),
    subject: "Your Invoice from AirInvoice",
    text: `Hello,\n\nHere are your invoice details:\n\n${JSON.stringify(invoiceDetails, null, 2)}\n\nThank you.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    res.status(200).json({ message: "Invoice email sent successfully" });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    res.status(500).json({ error: "Failed to send invoice email" });
  }
};