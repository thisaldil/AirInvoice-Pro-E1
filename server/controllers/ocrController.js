const path = require('path');
const fs = require('fs');
const { extractTextFromPdf, extractStructuredData } = require('../services/huggingFaceService');

exports.handleOCR = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const rawText = await extractTextFromPdf(filePath);
    const structured = await extractStructuredData(rawText);

    fs.unlink(filePath, () => {});
    res.json({ structured });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract flight info' });
  }
};
