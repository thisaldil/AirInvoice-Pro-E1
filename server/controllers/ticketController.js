const path = require('path');
const fs = require('fs');
const { extractTicketText } = require('../services/googleDocAiService');
const nlp = require('compromise');

//ticket gadget format
exports.extractTicketData = async (req, res) => {
  let filePath;
  try {
    const file = req.file;
    filePath = path.join("/tmp/uploads", req.file.filename);
    const rawText = await extractTicketText(filePath);

    // Check if this is a Sabre format ticket by looking for key identifiers
    if (rawText.includes('Sabre') || rawText.includes('ITINERARY PREPARED FOR:')) {
      const result = await handleSabreTicket(rawText);

      // Clean up the uploaded file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });

      return res.json(result);
    }

    // Continue with existing ticket gadget ticket format handling
    // Basic info
    const passengerName = rawText.match(/[A-Z]+\s+[A-Z]+\/[A-Z]+(?:\s+[A-Z]+)?(?:\s+MR|MS|MRS)?/i)?.[0] || "";
    const bookingRef = rawText.match(/Booking Ref:\s*(\d+)/i)?.[1] || "";
    const ticketNumber = rawText.match(/Ticket Number\s*\n\s*(\d+)/i)?.[1] || "";

    // Find the class once - it will be the same for all flights
    const classMatch = rawText.match(/\b(ECONOMY|PREMIUM ECONOMY|BUSINESS|FIRST)\b/);
    const travelClass = classMatch ? classMatch[1] : "ECONOMY";

    const flightDetails = [];

    // Split the text into sections by date headers
    const sections = rawText.split(/(?=\d{2}\s+[A-Z]{3}\s+\d{4}\s*\n)/);

    for (const section of sections) {
      // Extract date
      const dateMatch = section.match(/(\d{2}\s+[A-Z]{3}\s+\d{4})/);
      if (!dateMatch) continue;

      // Extract flight number - looking for airline codes followed by numbers
      const flightMatch = section.match(/(?:G9|AA|AC|AF|AI|AY|AZ|BA|BR|CA|CX|DL|EK|EY|GA|JL|KE|KL|LH|LO|LX|MH|MS|NH|NZ|OS|PK|QF|QR|SA|SK|SQ|SU|TG|TK|UA|UL|VN|VS|WY|ZH)\s*(\d+)/);
      if (!flightMatch) continue;

      // Extract departure info
      const departureMatch = section.match(/([A-Z]{3})\s*\n([^,\n]+)\s*\n([^,\n]+),\s*([^\n]+)\s*\n(\d{2}\s+[A-Z]{3}\s+\d{4}\s+\d{2}:\d{2})/);

      // Extract arrival info - look for the next airport code after the departure
      const arrivalMatch = section.match(/(?:.*?\n){5,10}([A-Z]{3})\s*\n([^,\n]+)\s*\n([^,\n]+),\s*([^\n]+)\s*\n(\d{2}\s+[A-Z]{3}\s+\d{4}\s+\d{2}:\d{2})/s);

      if (departureMatch && arrivalMatch) {
        // Extract terminal
        const terminalMatch = section.match(/Terminal:\s*([^\n]+)/);

        // Extract airline and status - look for any word or phrase between newlines that could be an airline
        const airlineMatch = section.match(/\n([A-Za-z\s]+(?:Airways|Airlines|Air|Aviation)?)\n/);
        const statusMatch = section.match(/Status:\s*([^\n]+)/);

        // Parse departure and arrival times
        const departureDateTime = departureMatch[5].match(/(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(\d{2}:\d{2})/);
        const arrivalDateTime = arrivalMatch[5].match(/(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(\d{2}:\d{2})/);

        flightDetails.push({
          flightNumber: flightMatch[0].replace(/\s+/, ' '),
          airline: airlineMatch ? airlineMatch[1].trim() : "",
          from: departureMatch[1],
          fromLocation: `${departureMatch[2].trim()}\n${departureMatch[3].trim()}, ${departureMatch[4].trim()}`,
          to: arrivalMatch[1],
          toLocation: `${arrivalMatch[2].trim()}\n${arrivalMatch[3].trim()}, ${arrivalMatch[4].trim()}`,
          departureDate: departureDateTime[1],
          departureTime: departureDateTime[2],
          arrivalDate: arrivalDateTime[1],
          arrivalTime: arrivalDateTime[2],
          departureTerminal: terminalMatch ? terminalMatch[1].trim() : "",
          class: travelClass,
          status: statusMatch ? statusMatch[1].trim() : "Confirmed"
        });
      }
    }

    // Clean up the uploaded file after processing
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });

    return res.json({
      passengerName,
      bookingReference: bookingRef,
      transactionId: ticketNumber,
      flightDetails
    });

  } catch (error) {
    // Clean up the file even if there's an error
    if (filePath) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    console.error("DocAI error:", error);
    return res.status(500).json({ error: "Failed to extract ticket details", detail: error.message });
  }
};

//sabre format
// sabre format
async function handleSabreTicket(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let bookingReference = '';
  let email = '';
  let passengerNames = [];
  let flightDetails = [];

  // Extract booking reference
  const bookingRefMatch = rawText.match(/BOOKING REF:\s*([A-Z0-9]+)/i);
  bookingReference = bookingRefMatch ? bookingRefMatch[1].trim() : '';

  // Extract email
  const emailMatch = rawText.match(/EMAIL ADDRESS:\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  email = emailMatch ? emailMatch[1].trim() : '';

  // Extract passenger names
  const passengerStartIndex = lines.findIndex(line => line.includes('ITINERARY PREPARED FOR:'));
  if (passengerStartIndex !== -1) {
    for (let i = passengerStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(DAY|DATE|FLIGHT|STOP|EQP|CLASS|FLYING TIME|SERVICES)/i.test(line)) break;
      if (line.match(/[A-Z]+\/[A-Z]+(?:\s+[A-Z]+)?\s*(MR|MS|MRS)/i)) {
        passengerNames.push(line);
      }
    }
  }

  // Extract flight details
  const flightPattern = /([A-Z]{3})\s+(\d{4})\s+([A-Z]{3})\s+(\d{4})\s+([A-Z]{2,3}\s*\d+)\s+([A-Z]+)/g;
  const flightSections = rawText.split(/DAY\s+DATE/).slice(1);

  for (const section of flightSections) {
    let match;
    while ((match = flightPattern.exec(section)) !== null) {
      const [_, from, depTime, to, arrTime, flightNumber, travelClass] = match;
      const status = section.includes("CONFIRMED") ? "Confirmed" : "Unknown";
      const durationMatch = section.match(/\d+HR\s+\d+MIN/);
      const duration = durationMatch ? durationMatch[0].replace(/\s+/g, ' ') : '';

      flightDetails.push({
        flightNumber: flightNumber.trim(),
        airline: flightNumber.split(' ')[0].trim(),
        from: from.trim(),
        to: to.trim(),
        departureTime: formatTime(depTime),
        arrivalTime: formatTime(arrTime),
        class: travelClass.trim(),
        status: status.trim(),
        duration: duration,
        services: section.includes("MEALS") ? "MEALS" : "NO MEALS"
      });
    }
  }

  return {
    bookingReference,
    email,
    passengerNames,
    flightDetails
  };
}

// Helper function to format time
function formatTime(time) {
  return time.replace(/(\d{2})(\d{2})/, '$1:$2');
}

