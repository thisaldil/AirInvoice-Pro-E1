const mindee = require("mindee");
const axios = require("axios");
const path = require("path");

const processInvoice = async (filePath) => {
  const mindeeClient = new mindee.Client({
    apiKey: process.env.MINDEE_API_KEY,
  });
  const inputSource = mindeeClient.docFromPath(filePath);
  const customEndpoint = mindeeClient.createEndpoint(
    "aire_ticket",
    "office",
    "1"
  );

  const resp = await mindeeClient.enqueueAndParse(
    mindee.product.GeneratedV1,
    inputSource,
    {
      endpoint: customEndpoint,
    }
  );

  const jobId = resp.job.id;
  const pollUrl = `https://api.mindee.net/v1/products/office/aire_ticket/v1/documents/queue/${jobId}`;

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    await new Promise((res) => setTimeout(res, 3000));

    try {
      const pollResponse = await axios.get(pollUrl, {
        headers: { Authorization: `Token ${process.env.MINDEE_API_KEY}` },
      });

      if (pollResponse.data?.job?.available_at) {
        console.log("✅ Prediction ready");
        return pollResponse.data.document.inference.prediction;
      }

      console.log("⏳ Not ready yet... attempt", attempts + 1);
    } catch (err) {
      console.error(
        "❌ Mindee Polling Error:",
        err.response?.status,
        err.response?.data
      );
      if (err.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
      }
      throw err;
    }

    attempts++;
  }

  throw new Error("Timed out waiting for Mindee to process the document.");
};

module.exports = { processInvoice };
