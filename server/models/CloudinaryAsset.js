const mongoose = require("mongoose");
const { Schema } = mongoose;

const cloudinaryAssetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assetId: { type: String, required: true, unique: true },
    publicId: { type: String, required: true, unique: true },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      required: true,
    },
    deliveryType: {
      type: String,
      enum: ["authenticated"],
      default: "authenticated",
    },
    purpose: {
      type: String,
      enum: ["invoice", "template-logo", "profile"],
      required: true,
    },
    format: String,
    bytes: { type: Number, min: 0 },
    width: Number,
    height: Number,
    version: { type: Number, required: true },
    originalFilename: String,
    secureUrl: String,
    linkedInvoice: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    linkedTemplate: { type: Schema.Types.ObjectId, ref: "Template", default: null },
  },
  { timestamps: true }
);

cloudinaryAssetSchema.index({ userId: 1, createdAt: -1 });
cloudinaryAssetSchema.index({ userId: 1, purpose: 1 });

module.exports = mongoose.model("CloudinaryAsset", cloudinaryAssetSchema);
