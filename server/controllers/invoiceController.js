const fs = require("fs");
const path = require("path");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");
const axios = require("axios");

//upload invoice and perform OCR
exports.uploadInvoice = async (req, res) => {
  const filePath = req.file.path;
  const outputDir = `temp_output_${Date.now()}`;

  try {
    fs.mkdirSync(outputDir);

    const convert = fromPath(filePath, { density: 200, savePath: outputDir });
    const imagePages = await convert.bulk(-1);
    const imageFiles = imagePages.map(p => p.path);

    let fullText = "";

    for (const imgPath of imageFiles) {
      const { data: { text } } = await Tesseract.recognize(imgPath, "eng");
      fullText += text + "\n";
    }

    fs.unlinkSync(filePath);
    fs.rmSync(outputDir, { recursive: true });

    res.status(200).json({ success: true, text: fullText });
  } catch (err) {
    console.error("OCR processing error:", err);
    res.status(500).json({ success: false, message: "OCR failed." });
  }
};

//save invoice details
exports.saveInvoiceDetails = async (req, res) => {
  const { userId, pdfUrl, template, invoiceDetails, priceDetails } = req.body;

  if (!userId || !pdfUrl || !template?._id || !invoiceDetails?.bookingReference || !invoiceDetails?.passengerName || !invoiceDetails?.passengers || !priceDetails) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const invoice = new Invoice({
      userId,
      pdfUrl,
      template: {
        _id: template._id,
        company: {
          name: template.company.name,
          logo: template.company.logo,
          address: template.company.address,
        },
      },
      invoiceDetails: {
        bookingReference: invoiceDetails.bookingReference,
        passengerName: invoiceDetails.passengerName,
        passengers: invoiceDetails.passengers,
      },
      priceDetails: {
        totalAmount: priceDetails.totalAmount,
        paymentMethod: priceDetails.paymentMethod,
        transactionId: priceDetails.transactionId,
      },
    });

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

//get invoice by invoiceId
exports.getInvoiceDetailsByInvoiceId = async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return res.status(400).json({ error: "Invoice ID is required" });
  }

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//send invoice email
exports.sendInvoiceEmail = async (req, res) => {
  const { email, pdfUrl } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Valid recipient email is required" });
  }

  if (!pdfUrl || typeof pdfUrl !== "string" || !pdfUrl.startsWith("http")) {
    return res.status(400).json({ error: "Valid PDF URL is required" });
  }

  const fileName = `${uuidv4()}.pdf`;
  const tempPath = path.join("/tmp", fileName);

  try {
    // Download PDF from Cloudinary
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(tempPath, Buffer.from(response.data));

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
      html: `
          <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #004cc7;">✈️ AirInvoice Pro</h2>
            <p>Dear Customer,</p>
            <p>Thank you for choosing AirInvoice Pro.</p>
            <p>Please find your attached invoice below.</p>

            <div style="margin: 20px 0; padding: 16px; background-color: #f4f8ff; border-left: 4px solid #004cc7;">
              <strong style="color: #004cc7;">Need Help?</strong><br/>
              If you have any questions, just reply to this email.
            </div>

            <p style="font-size: 14px;">Best regards,<br/><strong>The AirInvoice Pro Team</strong></p>

            <hr style="margin-top: 30px;"/>
            <p style="font-size: 12px; color: #888;">
              © ${new Date().getFullYear()} AirInvoice Pro. All rights reserved.
            </p>
          </div>`,
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

//delete template by id
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "invoice not found" });
    }
    res.status(200).json({ message: "invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

exports.getRecentInvoices = async (req, res) => {
  try {
    const recentInvoices = await Invoice.find(
      {},
      {
        "invoiceDetails.passengerName": 1,
        "invoiceDetails.passportNumber": 1,
        "invoiceDetails.nationality": 1,
        "priceDetails.totalAmount": 1,
        createdAt: 1, // include this if you want date
      }
    )
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json(recentInvoices);
  } catch (err) {
    console.error("Error fetching recent invoices:", err);
    res.status(500).json({ error: "Failed to fetch recent invoices" });
  }
};
