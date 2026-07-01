import { authFetch } from "./api";

const readJson = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "Cloudinary upload failed");
  }
  return data;
};

export const uploadUserAsset = async (file, purpose, resourceType) => {
  const limits = {
    invoice: {
      maxBytes: 10 * 1024 * 1024,
      types: ["application/pdf"],
    },
    "template-logo": {
      maxBytes: 5 * 1024 * 1024,
      types: ["image/gif", "image/jpeg", "image/png", "image/webp"],
    },
    profile: {
      maxBytes: 5 * 1024 * 1024,
      types: ["image/jpeg", "image/png", "image/webp"],
    },
  };
  const limit = limits[purpose];
  if (!limit || !limit.types.includes(file.type) || file.size > limit.maxBytes) {
    throw new Error("Unsupported file type or file is too large");
  }

  const signatureResponse = await authFetch("/cloudinary/signature", {
    method: "POST",
    body: JSON.stringify({ purpose, resourceType }),
  });
  const uploadConfig = await readJson(signatureResponse);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", uploadConfig.apiKey);
  formData.append("signature", uploadConfig.signature);
  Object.entries(uploadConfig.parameters).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  const cloudinaryResponse = await fetch(uploadConfig.uploadUrl, {
    method: "POST",
    body: formData,
  });
  const uploaded = await readJson(cloudinaryResponse);

  const registrationResponse = await authFetch("/cloudinary/assets", {
    method: "POST",
    body: JSON.stringify({
      publicId: uploaded.public_id,
      purpose,
      resourceType: uploaded.resource_type,
      signature: uploaded.signature,
      version: uploaded.version,
    }),
  });
  const registration = await readJson(registrationResponse);
  return registration.asset;
};

export const deleteUserAsset = async (assetId) => {
  if (!assetId) return;
  const response = await authFetch(`/cloudinary/assets/${assetId}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404 && response.status !== 409) {
    const data = await response.json();
    throw new Error(data.error || "Failed to clean up uploaded asset");
  }
};
