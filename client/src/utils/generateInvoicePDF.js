import { PDFDocument } from 'pdf-lib';

export const generateInvoicePDF = async (invoiceData) => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const { width, height } = page.getSize();

  let y = height - 50;

  const drawLine = (label, value) => {
    page.drawText(`${label}: ${value || ""}`, { x: 50, y });
    y -= 20;
  };

  drawLine("Passenger Name", invoiceData.passengerName);
  drawLine("Booking Reference", invoiceData.bookingReference);
  drawLine("Passport Number", invoiceData.passportNumber);
  drawLine("Nationality", invoiceData.nationality);
  drawLine("Date of Birth", invoiceData.dob);
  drawLine("Gender", invoiceData.gender);
  drawLine("Payment Method", invoiceData.paymentMethod);
  drawLine("Transaction ID", invoiceData.transactionId);
  drawLine("Total Amount", invoiceData.totalAmount);

  if (Array.isArray(invoiceData.flightDetails)) {
    invoiceData.flightDetails.forEach((flight, index) => {
      y -= 10;
      drawLine(`Flight #${index + 1}`, "");
      drawLine("  Flight No", flight.flightNumber);
      drawLine("  From", flight.from);
      drawLine("  To", flight.to);
      drawLine("  Departure", `${flight.departureDate} ${flight.departureTime}`);
      drawLine("  Arrival", `${flight.arrivalDate} ${flight.arrivalTime}`);
      drawLine("  Seat", flight.seatNumber);
      drawLine("  Class", flight.class);
      drawLine("  Baggage", flight.baggageAllowance);
    });
  }

  const pdfBytes = await doc.save();
  const base64PDF = btoa(
    new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  return base64PDF;
};