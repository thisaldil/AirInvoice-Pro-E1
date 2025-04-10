const fs = require("fs");
const path = require("path");
const pdfPoppler = require("pdf-poppler");
const Tesseract = require("tesseract.js");

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
