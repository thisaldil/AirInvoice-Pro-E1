function validateInvoiceSchema(data) {
  if (!data || typeof data !== 'object') throw new Error("Invalid data: not an object");

  const validated = {
    bookingReference: String(data.bookingReference || '').trim(),
    transactionId: String(data.transactionId || '').trim(),
    passengerName: Array.isArray(data.passengerName)
      ? data.passengerName.map(name => String(name).trim())
      : [String(data.passengerName || '').trim()],
    flights: [],
  };

  if (!Array.isArray(data.flights)) throw new Error("Invalid data: 'flights' must be an array");

  validated.flights = data.flights.map((flight, i) => {
    if (typeof flight !== 'object') throw new Error(`Flight #${i + 1} is not an object`);
    return {
      flightNumber: String(flight.flightNumber || '').trim(),
      from: String(flight.from || '').trim(),
      to: String(flight.to || '').trim(),
      departure: String(flight.departure || '').trim(),
      arrival: String(flight.arrival || '').trim(),
      status: String(flight.status || '').trim(),
      terminal: String(flight.terminal || '').trim(),
      airline: String(flight.airline || '').trim(),
      class: String(flight.class || '').trim(),
    };
  });

  return validated;
}

module.exports = validateInvoiceSchema;