const path = require("path");
const { processInvoice } = require("../services/mindeeService");

const uploadInvoice = async (req, res) => {
  try {
    if (!req.file) throw new Error("No file received");

    const filePath = path.resolve(req.file.path);
    console.log("🟢 File received at:", filePath);

    const prediction = await processInvoice(filePath);

    res.json({ success: true, prediction });
  } catch (err) {
    console.error("❌ Mindee error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadInvoice };
