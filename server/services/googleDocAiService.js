const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');
const path = require('path');

const PROJECT_ID = '654296127580';
const LOCATION = 'us';
const PROCESSOR_ID = '9087474c88a70213';

const client = new DocumentProcessorServiceClient({
  keyFilename: path.join(__dirname, '../key/docai-key.json')
});

async function extractTicketText(filePath) {
  const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

  const fileBuffer = fs.readFileSync(filePath);

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString('base64'),
      mimeType: 'application/pdf',
    },
  };

  const [result] = await client.processDocument(request);
  const text = result.document.text;
  return text;
}

module.exports = { extractTicketText };
