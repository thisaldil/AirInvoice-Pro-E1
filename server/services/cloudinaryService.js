const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");

const DELIVERY_TYPE = "authenticated";
const ACCESS_URL_TTL_SECONDS = 5 * 60;

const getConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required"
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret };
};

const createUploadSignature = ({
  allowedFormats,
  userId,
  purpose,
  resourceType,
}) => {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId =
    `airinvoice/users/${userId}/${purpose}/${crypto.randomUUID()}`;
  const parameters = {
    allowed_formats: allowedFormats.join(","),
    context: `owner_id=${userId}|purpose=${purpose}`,
    overwrite: "false",
    public_id: publicId,
    timestamp,
  };
  const signature = cloudinary.utils.api_sign_request(parameters, apiSecret);

  return {
    apiKey,
    cloudName,
    deliveryType: DELIVERY_TYPE,
    parameters,
    publicId,
    resourceType,
    signature,
    uploadUrl:
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/${DELIVERY_TYPE}`,
  };
};

const verifyUploadResponse = ({ publicId, version, signature }) => {
  getConfig();
  return cloudinary.utils.verify_api_response_signature(
    publicId,
    version,
    signature
  );
};

const getCloudinaryResource = async (publicId, resourceType) => {
  getConfig();
  return cloudinary.api.resource(publicId, {
    resource_type: resourceType,
    type: DELIVERY_TYPE,
  });
};

const getPrivateDownloadUrl = (asset) => {
  getConfig();
  return cloudinary.utils.private_download_url(
    asset.publicId,
    asset.format || "",
    {
      attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + ACCESS_URL_TTL_SECONDS,
      resource_type: asset.resourceType,
      type: DELIVERY_TYPE,
    }
  );
};

const destroyCloudinaryAsset = async (asset) => {
  getConfig();
  return cloudinary.uploader.destroy(asset.publicId, {
    invalidate: true,
    resource_type: asset.resourceType,
    type: DELIVERY_TYPE,
  });
};

module.exports = {
  DELIVERY_TYPE,
  createUploadSignature,
  destroyCloudinaryAsset,
  getCloudinaryResource,
  getPrivateDownloadUrl,
  verifyUploadResponse,
};
