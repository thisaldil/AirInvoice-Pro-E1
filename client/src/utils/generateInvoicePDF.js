import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateInvoicePDF = async (invoiceData, selectedTemplate) => {
  const {
    company,
    design
  } = selectedTemplate;

  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const { width, height } = page.getSize();

  const fontSize = 11;
  const lineHeight = 18;
  let y = height - 50;

  const font = await doc.embedFont(StandardFonts.Helvetica);

  const drawText = (text, x = 50, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color
    });
    y -= lineHeight;
  };

  // Header
  if (company.logo) {
    const imageBytes = await fetch(company.logo).then(res => res.arrayBuffer());
    const image = await doc.embedPng(imageBytes);
    page.drawImage(image, {
      x: 50,
      y: height - 100,
      width: 80,
      height: 40
    });
  }

  drawText(company.name, 140, rgbHex(design.accentColor));
  drawText(invoiceData.passengerName, 140);
  y -= 10;

  drawText(`Invoice #INV-2023-001`);
  drawText(`Date: ${new Date().toLocaleDateString()}`);
  y -= 20;

  drawText("From:");
  drawText(company.address);
  y -= 20;

  drawText("To:");
  drawText(invoiceData.passengerName);
  drawText(`Passport: ${invoiceData.passportNumber}`);
  drawText(`Nationality: ${invoiceData.nationality}`);
  drawText(`DOB: ${invoiceData.dob}`);
  drawText(`Gender: ${invoiceData.gender}`);
  y -= 20;

  // Flight Info
  if (Array.isArray(invoiceData.flightDetails)) {
    invoiceData.flightDetails.forEach((flight, i) => {
      drawText(`Flight #${i + 1}`);
      drawText(`  Flight No: ${flight.flightNumber}`);
      drawText(`  From: ${flight.from}`);
      drawText(`  To: ${flight.to}`);
      drawText(`  Departure: ${flight.departureDate} ${flight.departureTime}`);
      drawText(`  Arrival: ${flight.arrivalDate} ${flight.arrivalTime}`);
      drawText(`  Seat: ${flight.seatNumber}`);
      drawText(`  Class: ${flight.class}`);
      drawText(`  Baggage: ${flight.baggageAllowance}`);
      y -= 10;
    });
  }

  y -= 10;
  drawText(`Payment Method: ${invoiceData.paymentMethod}`);
  drawText(`Transaction ID: ${invoiceData.transactionId}`);
  drawText(`Total Amount: ${invoiceData.totalAmount}`, 50, rgbHex(design.accentColor));

  // Footer
  if (design.showFooter && design.footerText) {
    page.drawText(design.footerText, {
      x: 50,
      y: 40,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4)
    });
  }

  const pdfBytes = await doc.save();
  const base64PDF = btoa(
    new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  return base64PDF;
};

// Utility to convert HEX to rgb()
function rgbHex(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return rgb(
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255
  );
}
