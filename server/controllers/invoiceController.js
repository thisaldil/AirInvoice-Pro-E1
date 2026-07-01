const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const axios = require("axios");
const Invoice = require("../models/Invoice");
const Template = require("../models/Template");
const CloudinaryAsset = require("../models/CloudinaryAsset");
const {
  destroyCloudinaryAsset,
  getPrivateDownloadUrl,
} = require("../services/cloudinaryService");

const getRequestUserId = (req) => req.userId || req.user?._id?.toString();

const assertOwnedUserParam = (req, res, userId) => {
  const requestUserId = getRequestUserId(req);
  if (userId && userId !== requestUserId) {
    res.status(403).json({ error: "You do not have access to this user's data" });
    return false;
  }
  return true;
};

const parseAmount = (value) => {
  const amount = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const isAllowedInvoiceUrl = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return false;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return !cloudName || url.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
};

const addAssetAccessUrls = async (invoices, userId) => {
  const list = Array.isArray(invoices) ? invoices : [invoices];
  const assetIds = list
    .map((invoice) => invoice?.cloudinaryAsset)
    .filter(Boolean);
  const logoAssetIds = list
    .map((invoice) => invoice?.template?.company?.logoAsset)
    .filter(Boolean);
  const allAssetIds = [...assetIds, ...logoAssetIds];
  const assets = allAssetIds.length
    ? await CloudinaryAsset.find({
        _id: { $in: allAssetIds },
        userId,
      })
    : [];
  const assetsById = new Map(
    assets.map((asset) => [asset._id.toString(), asset])
  );

  const serialized = list.map((invoice) => {
    const data = invoice.toObject ? invoice.toObject() : { ...invoice };
    const asset = data.cloudinaryAsset
      ? assetsById.get(data.cloudinaryAsset.toString())
      : null;

    if (asset) {
      data.cloudinaryAssetId = asset._id;
      data.pdfUrl = getPrivateDownloadUrl(asset);
    }

    const logoAssetId = data.template?.company?.logoAsset;
    const logoAsset = logoAssetId
      ? assetsById.get(logoAssetId.toString())
      : null;
    if (logoAsset) {
      data.template.company.logoAssetId = logoAsset._id;
      data.template.company.logo = getPrivateDownloadUrl(logoAsset);
    }

    return data;
  });

  return Array.isArray(invoices) ? serialized : serialized[0];
};

// Upload invoice and perform OCR.
exports.uploadInvoice = async (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ success: false, message: "Invoice PDF is required" });
  }

  const filePath = req.file.path;
  const outputDir = `temp_output_${Date.now()}`;

  try {
    fs.mkdirSync(outputDir);

    const convert = fromPath(filePath, { density: 200, savePath: outputDir });
    const imagePages = await convert.bulk(-1);
    const imageFiles = imagePages.map((p) => p.path);

    let fullText = "";

    for (const imgPath of imageFiles) {
      const {
        data: { text },
      } = await Tesseract.recognize(imgPath, "eng");
      fullText += `${text}\n`;
    }

    fs.unlinkSync(filePath);
    fs.rmSync(outputDir, { recursive: true, force: true });

    return res.status(200).json({ success: true, text: fullText });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    console.error("OCR processing error:", err);
    return res.status(500).json({ success: false, message: "OCR failed." });
  }
};

// Save invoice details for the logged-in user.
exports.saveInvoiceDetails = async (req, res) => {
  const requestUserId = getRequestUserId(req);
  const {
    cloudinaryAssetId,
    template,
    invoiceDetails,
    priceDetails,
  } = req.body;

  if (
    !requestUserId ||
    !cloudinaryAssetId ||
    !template?._id ||
    !invoiceDetails?.bookingReference ||
    !invoiceDetails?.passengerName ||
    !invoiceDetails?.passengers ||
    !priceDetails
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    !mongoose.isValidObjectId(template._id) ||
    !mongoose.isValidObjectId(cloudinaryAssetId)
  ) {
    return res.status(400).json({ error: "Invalid template or asset ID" });
  }

  try {
    const [ownedTemplate, ownedAsset] = await Promise.all([
      Template.findOne({
        _id: template._id,
        userId: requestUserId,
      }),
      CloudinaryAsset.findOne({
        _id: cloudinaryAssetId,
        userId: req.user._id,
        purpose: "invoice",
        resourceType: "raw",
        linkedInvoice: null,
      }),
    ]);

    if (!ownedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    if (!ownedAsset) {
      return res.status(404).json({ error: "Uploaded invoice asset not found" });
    }

    const invoice = new Invoice({
      userId: requestUserId,
      cloudinaryAsset: ownedAsset._id,
      template: {
        _id: ownedTemplate._id,
        company: {
          name: ownedTemplate.company?.name,
          logo: ownedTemplate.company?.logo,
          logoAsset: ownedTemplate.company?.logoAsset,
          address: ownedTemplate.company?.address,
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

    const linkedAsset = await CloudinaryAsset.findOneAndUpdate(
      {
        _id: ownedAsset._id,
        userId: req.user._id,
        linkedInvoice: null,
      },
      { $set: { linkedInvoice: invoice._id } },
      { new: true }
    );

    if (!linkedAsset) {
      await invoice.deleteOne();
      return res.status(409).json({ error: "Uploaded asset is already in use" });
    }

    const serializedInvoice = await addAssetAccessUrls(invoice, req.user._id);
    return res.status(201).json({
      message: "Invoice saved successfully",
      invoice: serializedInvoice,
    });
  } catch (err) {
    console.error("Error saving invoice:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get invoices for the logged-in user. The URL param is kept for backward compatibility.
exports.getInvoiceDetailsByUserId = async (req, res) => {
  const requestUserId = getRequestUserId(req);
  const { userId } = req.params;

  if (!assertOwnedUserParam(req, res, userId)) return;

  try {
    const invoices = await Invoice.find({ userId: requestUserId }).sort({ createdAt: -1 });
    return res.json(await addAssetAccessUrls(invoices, req.user._id));
  } catch (err) {
    console.error("Error fetching invoices:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get a single invoice owned by the logged-in user.
exports.getInvoiceDetailsByInvoiceId = async (req, res) => {
  const requestUserId = getRequestUserId(req);
  const { invoiceId } = req.params;

  if (!mongoose.isValidObjectId(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId: requestUserId });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.status(200).json(
      await addAssetAccessUrls(invoice, req.user._id)
    );
  } catch (err) {
    console.error("Error fetching invoice:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Send an invoice email only for an invoice owned by the logged-in user.
exports.sendInvoiceEmail = async (req, res) => {
  const requestUserId = getRequestUserId(req);
  const { email, invoiceId, pdfUrl } = req.body;

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({ error: "Valid recipient email is required" });
  }

  if (invoiceId && !mongoose.isValidObjectId(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  if (!invoiceId && !pdfUrl) {
    return res.status(400).json({ error: "Invoice ID is required" });
  }

  const fileName = `${uuidv4()}.pdf`;
  const tempPath = path.join("/tmp", fileName);

  try {
    const invoice = invoiceId
      ? await Invoice.findOne({ _id: invoiceId, userId: requestUserId })
      : await Invoice.findOne({ pdfUrl, userId: requestUserId });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    let downloadUrl = invoice.pdfUrl;
    if (invoice.cloudinaryAsset) {
      const asset = await CloudinaryAsset.findOne({
        _id: invoice.cloudinaryAsset,
        userId: req.user._id,
        linkedInvoice: invoice._id,
      });
      if (!asset) {
        return res.status(404).json({ error: "Invoice file not found" });
      }
      downloadUrl = getPrivateDownloadUrl(asset);
    } else if (!isAllowedInvoiceUrl(downloadUrl)) {
      return res.status(400).json({ error: "Invalid invoice PDF URL" });
    }

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024,
      maxRedirects: 3,
    });
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
            <h2 style="color: #004cc7;">AirInvoice Pro</h2>
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

    return res.status(200).json({ message: "Invoice email sent successfully" });
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("Error sending invoice email:", error);
    return res.status(500).json({ error: "Failed to send invoice email" });
  }
};

exports.deleteInvoice = async (req, res) => {
  const requestUserId = getRequestUserId(req);
  const { invoiceId } = req.params;

  if (!mongoose.isValidObjectId(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId: requestUserId });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.cloudinaryAsset) {
      const asset = await CloudinaryAsset.findOne({
        _id: invoice.cloudinaryAsset,
        userId: req.user._id,
        linkedInvoice: invoice._id,
      });
      if (asset) {
        const result = await destroyCloudinaryAsset(asset);
        if (!["ok", "not found"].includes(result.result)) {
          return res.status(502).json({ error: "Cloudinary file deletion failed" });
        }
        await asset.deleteOne();
      }
    }

    await invoice.deleteOne();
    return res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete invoice" });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: getRequestUserId(req) }).sort({ createdAt: -1 });
    return res.status(200).json(
      await addAssetAccessUrls(invoices, req.user._id)
    );
  } catch (err) {
    console.error("Error fetching invoices:", err);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

exports.getRecentInvoices = async (req, res) => {
  try {
    const recentInvoices = await Invoice.find(
      { userId: getRequestUserId(req) },
      {
        "invoiceDetails.passengerName": 1,
        "invoiceDetails.passengers": 1,
        "priceDetails.totalAmount": 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(3);

    return res.status(200).json(recentInvoices);
  } catch (err) {
    console.error("Error fetching recent invoices:", err);
    return res.status(500).json({ error: "Failed to fetch recent invoices" });
  }
};

exports.getMostRecentInvoices = exports.getRecentInvoices;

exports.getMonthlyInvoices = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const invoices = await Invoice.find({
      userId: getRequestUserId(req),
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    return res.status(200).json(invoices);
  } catch (err) {
    console.error("Error fetching monthly invoices:", err);
    return res.status(500).json({ error: "Failed to fetch monthly invoices" });
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const invoices = await Invoice.find({
      userId: getRequestUserId(req),
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + parseAmount(inv.priceDetails?.totalAmount),
      0
    );

    return res.status(200).json({ totalRevenue });
  } catch (err) {
    console.error("Error calculating monthly revenue:", err);
    return res.status(500).json({ error: "Failed to calculate monthly revenue" });
  }
};
