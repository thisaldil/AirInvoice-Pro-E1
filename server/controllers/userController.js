const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");

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

//save invoice details
exports.saveInvoiceDetails = async (req, res) => {
    const { userId, pdfUrl } = req.body;
    if (!userId || !pdfUrl) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const invoice = new Invoice({ userId, pdfUrl });
        await invoice.save();
        res.status(201).json({ message: "Invoice saved successfully", invoice });
    } catch (err) {
        console.error("Error saving invoice:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

//get invoice details by userId
exports.getInvoiceDetailsByUserId = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const invoices = await Invoice.find({ userId });
        if (!invoices.length) {
            return res.status(404).json({ error: "No invoices found for this user" });
        }
        res.json(invoices);
    } catch (err) {
        console.error("Error fetching invoices:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

//send invoice email
exports.sendInvoiceEmail = async (req, res) => {
    const { email, pdfUrl } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Valid recipient email is required" });
    }

    if (!pdfUrl) {
        return res.status(400).json({ error: "PDF URL is required" });
    }

    const fileName = `${uuidv4()}.pdf`;
    const tempPath = path.join(__dirname, "..", "temp", fileName);

    try {
        const response = await axios.get(pdfUrl, { responseType: "stream" });
        const writer = fs.createWriteStream(tempPath);

        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

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
            text: "Hello,\n\nPlease find attached your invoice.\n\nThank you.",
            attachments: [
                {
                    filename: "invoice.pdf",
                    path: tempPath,
                    contentType: "application/pdf",
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        fs.unlinkSync(tempPath);

        res.status(200).json({ message: "Invoice email sent successfully" });
    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error("Error sending invoice email:", error);
        res.status(500).json({ error: "Failed to send invoice email" });
    }
};