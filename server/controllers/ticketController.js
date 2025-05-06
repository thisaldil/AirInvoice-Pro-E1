const path = require('path');
const fs = require('fs');
const { extractTicketText } = require('../services/googleDocAiService');

//ticket gadget format
exports.extractTicketData = async (req, res) => {
  let filePath;
  try {
    const file = req.file;
    filePath = path.join(__dirname, '../uploads', file.filename);
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
async function handleSabreTicket(rawText) {
  try {
    // Passenger Extraction
    const passengerBlock = rawText.match(/ITINERARY PREPARED FOR:\s*((?:.+\n)+?)(?=\b(?:DAY|DATE|FLIGHT)\b)/i);
    const passengerName = passengerBlock?.[1]
      ?.split(/\n/)
      .map(line => line.replace(/\s{2,}/g, ' ').trim())
      .filter(line => line.length > 0) || [];

    // Basic Info
    const bookingRef = rawText.match(/BOOKING REF:\s*(\w+)/i)?.[1] || '';
    const email = rawText.match(/EMAIL ADDRESS:\s*(\S+)/i)?.[1] || '';

    // Flight Processing
    const flightSegments = [];
    const lines = rawText.split(/\n/g).map(l => l.trim()).filter(l => l);
    
    let currentFlight = null;
    let currentDate = '';
    let currentDay = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Date/Day Tracking
      const dayMatch = line.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)\b/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        currentDate = lines[i+1]?.match(/\d{2}[A-Z]{3}/)?.[0] || currentDate;
        continue;
      }

      // Departure Block
      if (line.startsWith('DEP')) {
        currentFlight = {
          day: currentDay,
          departureDate: `${currentDate} 2025`,
          airline: '',
          from: '',
          to: '',
          departureTime: '',
          arrivalTime: '',
          flightNumber: '',
          class: 'ECONOMY',
          status: 'CONFIRMED',
          aircraft: '',
          duration: ''
        };

        // Extract departure city and time
        let depCity = '';
        while (lines[++i] && !lines[i].startsWith('ARR')) {
          if (/[A-Z]{3} \d{4}/.test(lines[i])) { // Time pattern
            currentFlight.departureTime = lines[i].replace(/(\d{2})(\d{2})/, '$1:$2');
          } else if (/^[A-Z]{2} \d+$/.test(lines[i])) { // Flight number
            currentFlight.flightNumber = lines[i];
            currentFlight.airline = getAirlineName(lines[i].split(' ')[0]);
          } else if (/ECONOMY|BUSINESS/i.test(lines[i])) { // Class
            currentFlight.class = lines[i].split(' ')[0];
          } else if (/BOEING|AIRBUS/i.test(lines[i])) { // Aircraft
            currentFlight.aircraft = lines[i];
          } else if (/\d+HR \d+MIN/i.test(lines[i])) { // Duration
            const [hr, min] = lines[i].match(/\d+/g);
            currentFlight.duration = `${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
          } else if (!/DEP|TERMINAL|CONFIRMED/i.test(lines[i])) {
            depCity = lines[i].replace(/DEP\s+/i, '').trim();
          }
        }
        currentFlight.from = depCity;

        // Arrival Processing
        if (lines[i]?.startsWith('ARR')) {
          let arrCity = '';
          while (lines[++i] && !/\d{4} [A-Z]{3}/.test(lines[i])) {
            if (/[A-Z]{3} \d{4}/.test(lines[i])) { // Time pattern
              currentFlight.arrivalTime = lines[i].replace(/(\d{2})(\d{2})/, '$1:$2');
            } else if (!/ARR|TERMINAL/i.test(lines[i])) {
              arrCity = lines[i].replace(/ARR\s+/i, '').trim();
            }
          }
          currentFlight.to = arrCity;

          // Handle date crossing
          if (currentFlight.arrivalTime < currentFlight.departureTime) {
            const nextDay = new Date(currentFlight.departureDate);
            nextDay.setDate(nextDay.getDate() + 1);
            currentFlight.arrivalDate = formatDate(nextDay);
          }
        }

        flightSegments.push(currentFlight);
      }
    }

    return {
      passengerName,
      bookingReference: bookingRef,
      transactionId: bookingRef,
      email,
      flightDetails: flightSegments
    };
  } catch (error) {
    throw new Error(`Sabre parsing failed: ${error.message}`);
  }
}

// Helper functions
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).toUpperCase().replace(/ /g, '');
}

function getAirlineName(code) {
  const airlines = { 
    EY: 'Etihad Airways',
    AA: 'American Airlines',
    DL: 'Delta Air Lines',
    BA: 'British Airways'
  };
  return airlines[code] || code;
}
