const mongoose = require("mongoose");
const CloudinaryAsset = require("../models/CloudinaryAsset");
const {
  DELIVERY_TYPE,
  createUploadSignature,
  destroyCloudinaryAsset,
  getCloudinaryResource,
  getPrivateDownloadUrl,
  verifyUploadResponse,
} = require("../services/cloudinaryService");

const PURPOSE_CONFIG = {
  invoice: {
    resourceType: "raw",
    formats: new Set(["pdf"]),
    maxBytes: 10 * 1024 * 1024,
  },
  "template-logo": {
    resourceType: "image",
    formats: new Set(["gif", "jpeg", "jpg", "png", "webp"]),
    maxBytes: 5 * 1024 * 1024,
  },
  profile: {
    resourceType: "image",
    formats: new Set(["jpeg", "jpg", "png", "webp"]),
    maxBytes: 5 * 1024 * 1024,
  },
};

const toAssetResponse = (asset) => ({
  id: asset._id,
  purpose: asset.purpose,
  resourceType: asset.resourceType,
  format: asset.format,
  bytes: asset.bytes,
  width: asset.width,
  height: asset.height,
  originalFilename: asset.originalFilename,
  accessUrl: getPrivateDownloadUrl(asset),
  createdAt: asset.createdAt,
});

exports.createSignature = async (req, res) => {
  try {
    const { purpose = "invoice", resourceType } = req.body;
    const config = PURPOSE_CONFIG[purpose];

    if (!config || (resourceType && resourceType !== config.resourceType)) {
      return res.status(400).json({ error: "Unsupported upload purpose" });
    }

    return res.status(200).json(
      createUploadSignature({
        allowedFormats: [...config.formats],
        userId: req.userId,
        purpose,
        resourceType: config.resourceType,
      })
    );
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return res.status(500).json({ error: "Cloudinary is not configured" });
  }
};

exports.registerAsset = async (req, res) => {
  try {
    const { publicId, purpose, resourceType, signature, version } = req.body;
    const config = PURPOSE_CONFIG[purpose];
    const expectedPrefix = `airinvoice/users/${req.userId}/${purpose}/`;

    if (
      !config ||
      resourceType !== config.resourceType ||
      typeof publicId !== "string" ||
      !publicId.startsWith(expectedPrefix) ||
      !Number.isInteger(Number(version)) ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({ error: "Invalid Cloudinary upload response" });
    }

    if (
      !verifyUploadResponse({
        publicId,
        version: Number(version),
        signature,
      })
    ) {
      return res.status(401).json({ error: "Invalid Cloudinary response signature" });
    }

    const resource = await getCloudinaryResource(publicId, resourceType);
    const format = String(resource.format || "").toLowerCase();

    if (
      resource.type !== DELIVERY_TYPE ||
      resource.resource_type !== resourceType ||
      !config.formats.has(format) ||
      !Number.isFinite(resource.bytes) ||
      resource.bytes > config.maxBytes
    ) {
      return res.status(400).json({ error: "Uploaded file type or size is not allowed" });
    }

    const asset = await CloudinaryAsset.create({
      userId: req.user._id,
      assetId: resource.asset_id,
      publicId: resource.public_id,
      resourceType: resource.resource_type,
      deliveryType: resource.type,
      purpose,
      format,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      version: resource.version,
      originalFilename: resource.original_filename,
      secureUrl: resource.secure_url,
    });

    return res.status(201).json({ asset: toAssetResponse(asset) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Asset has already been registered" });
    }
    console.error("Cloudinary asset registration error:", error);
    return res.status(500).json({ error: "Failed to register uploaded asset" });
  }
};

exports.listAssets = async (req, res) => {
  try {
    const assets = await CloudinaryAsset.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(assets.map(toAssetResponse));
  } catch (error) {
    return res.status(500).json({ error: "Failed to load assets" });
  }
};

exports.getAsset = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid asset ID" });
  }

  try {
    const asset = await CloudinaryAsset.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.status(200).json(toAssetResponse(asset));
  } catch (error) {
    return res.status(500).json({ error: "Failed to load asset" });
  }
};

exports.deleteAsset = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid asset ID" });
  }

  try {
    const asset = await CloudinaryAsset.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    if (asset.linkedInvoice || asset.linkedTemplate) {
      return res.status(409).json({ error: "Asset is currently in use" });
    }

    const result = await destroyCloudinaryAsset(asset);
    if (!["ok", "not found"].includes(result.result)) {
      return res.status(502).json({ error: "Cloudinary did not delete the asset" });
    }

    await asset.deleteOne();
    return res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Cloudinary asset deletion error:", error);
    return res.status(500).json({ error: "Failed to delete asset" });
  }
};

exports.toAssetResponse = toAssetResponse;
