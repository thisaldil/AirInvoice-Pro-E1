const path = require('path');
const { extractTicketText } = require('../services/googleDocAiService');

exports.extractTicketData = async (req, res) => {
  try {
    const file = req.file;
    const filePath = path.join(__dirname, '../uploads', file.filename);
    const rawText = await extractTicketText(filePath);

    // Basic fields
    const passengerName = rawText.match(/[A-Z]+\/[A-Z]+(?:\s+[A-Z]+)?(?:\s+MR|MS|MRS)?/i)?.[0] || "";
    const bookingRef = rawText.match(/Booking Ref:?\s*([\w\d]+)/i)?.[1] || "";
    const ticketNumber = rawText.match(/Ticket Number:?\s*(\d+)/i)?.[1] || "";

    // Flight segment extraction (robust, layout-independent)
    const parseFlightDetails = (text) => {
      const flights = [];

      const pattern = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(G9\s*\d+)[\s\S]*?(CMB|SHJ)[\s\S]*?(\d{2}:\d{2})[\s\S]*?(CMB|SHJ)[\s\S]*?(\d{2}:\d{2})[\s\S]*?AirArabia[\s\S]*?Status:?\s*(Confirmed|Pending|Cancelled)?/gi;

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [
          _full,
          departureDate,
          flightNumber,
          from,
          departureTime,
          to,
          arrivalTime,
          status
        ] = match;

        flights.push({
          flightNumber: flightNumber.trim().replace(/\s+/, " "),
          airline: "AirArabia",
          from,
          to,
          departureDate,
          arrivalDate: departureDate,
          departureTime,
          arrivalTime,
          departureTerminal: "", // Optional - not present in all layouts
          class: "ECONOMY",
          status: status || "Confirmed",
          ticketNumber
        });
      }

      return flights;
    };

    const flightDetails = parseFlightDetails(rawText);

    return res.json({
      passengerName,
      bookingReference: bookingRef,
      transactionId: ticketNumber,
      flightDetails
    });

  } catch (error) {
    console.error("DocAI error:", error);
    return res.status(500).json({ error: "Failed to extract ticket details", detail: error.message });
  }
};
