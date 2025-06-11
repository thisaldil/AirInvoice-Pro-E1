const path = require('path');
const fs = require('fs');
const { extractTextFromPdf, extractStructuredData } = require('../services/huggingFaceService');

exports.handleOCR = async (req, res) => {
  try {
    const filePath = path.join("/tmp/uploads", req.file.filename);
    const rawText = await extractTextFromPdf(filePath);
    const structured = await extractStructuredData(rawText);

    const mappedInvoice = {
      bookingReference: structured.bookingReference || '',
      passengerName: Array.isArray(structured.passengerName)
        ? structured.passengerName.map(p => typeof p === 'string' ? p : p.name)
        : [structured.passengerName || ''],
      transactionId: structured.transactionId || '',
      flightDetails: (structured.flights || []).map(f => {
        const [depDate, depTime] = splitDateTime(f.departure);
        const [arrDate, arrTime] = splitDateTime(f.arrival);
        return {
          flightNumber: f.flightNumber || '',
          from: f.from || '',
          to: f.to || '',
          departureDate: depDate,
          departureTime: depTime,
          arrivalDate: arrDate,
          arrivalTime: arrTime,
          class: f.class || '',
          airline: f.airline || '',
          departureTerminal: f.terminal || '',
          status: f.status || ''
        };
      }),
    };

    fs.unlink(filePath, () => {});
    res.json(mappedInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract flight info' });
  }
};

function splitDateTime(str) {
  if (!str || typeof str !== 'string') return ['', ''];
  const match = str.match(/(\d{1,2}\s\w{3}\s\d{4})\s+(\d{2}:\d{2})/);
  return match ? [match[1], match[2]] : ['', str];
}