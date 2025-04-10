const mongoose = require('mongoose');
const { Schema } = mongoose;

const TemplateSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  isDefault: { type: Boolean, default: false },
  company: {
    name: String,
    logo: String,
    address: String,
  },
  design: {
    accentColor: String,
    showFooter: Boolean,
    footerText: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Template", TemplateSchema);
