const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    pdfUrl: { type: String, required: true },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
