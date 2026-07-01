const mongoose = require("mongoose");
const { Schema } = mongoose;

const invoiceSchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    pdfUrl: String,
    cloudinaryAsset: {
      type: Schema.Types.ObjectId,
      ref: "CloudinaryAsset",
      unique: true,
      sparse: true,
    },
    template: {
      _id: { type: Schema.Types.ObjectId, ref: "Template" },
      company: {
        name: String,
        logo: String,
        logoAsset: { type: Schema.Types.ObjectId, ref: "CloudinaryAsset" },
        address: String,
      },
    },
    invoiceDetails: {
        bookingReference: String,
        passengerName: [String],
        passengers: [{
            passportNumber: String,
            nationality: String,
            dob: String,
            gender: String
        }]
    },
    priceDetails: {
      totalAmount: String,
      paymentMethod: String,
      transactionId: String,
    },
  },
  { timestamps: true }
); // <- this line adds createdAt and updatedAt

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ userId: 1, "invoiceDetails.bookingReference": 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
