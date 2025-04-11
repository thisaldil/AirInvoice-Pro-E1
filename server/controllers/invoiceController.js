const fs = require("fs");
const path = require("path");
const pdfPoppler = require("pdf-poppler");
const Tesseract = require("tesseract.js");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");

exports.uploadInvoice = async (req, res) => {
  const filePath = req.file.path;
  const outputDir = `temp_output_${Date.now()}`;

  try {
    fs.mkdirSync(outputDir);

    const opts = {
      format: "png",
      out_dir: outputDir,
      out_prefix: "page",
      page: null,
    };

    await pdfPoppler.convert(filePath, opts);

    const imageFiles = fs
      .readdirSync(outputDir)
      .filter((f) => f.endsWith(".png"));

    let fullText = "";

    for (const file of imageFiles) {
      const imgPath = path.join(outputDir, file);
      const {
        data: { text },
      } = await Tesseract.recognize(imgPath, "eng");
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
  const { userId, pdfUrl } = req.body;

  if (!userId || !pdfUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const invoice = new Invoice({
      userId,
      pdfUrl,
    });

    await invoice.save();

    res.status(201).json({ message: "Invoice saved successfully" });
  }
  catch (err) {
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

  if (!pdfUrl || typeof pdfUrl !== "string") {
    return res.status(400).json({ error: "Valid base64 PDF is required" });
  }

  const fileName = `${uuidv4()}.pdf`;
  const tempPath = path.join(__dirname, "..", "temp", fileName);

  try {
    // Decode and save base64 PDF
    const base64Data = pdfUrl.replace(/^data:application\/pdf;base64,/, "");
    fs.writeFileSync(tempPath, Buffer.from(base64Data, "base64"));

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