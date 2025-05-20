const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');
require('dotenv').config();

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

async function extractStructuredData(text) {
  const prompt = `
Extract the following flight ticket text as structured JSON. 
Only return valid JSON object with fields:
- passenger
- flights: [flightNumber, from, to, departure, arrival, status]

TEXT:
${text}
`;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts structured data from travel tickets.' },
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = response.data.choices[0].message.content.trim();
  return JSON.parse(content); // auto-parse the JSON string
}

module.exports = { extractTextFromPdf, extractStructuredData };
