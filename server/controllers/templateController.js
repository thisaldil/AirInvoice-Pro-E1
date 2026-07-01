const mongoose = require("mongoose");
const Template = require("../models/Template.js");
const CloudinaryAsset = require("../models/CloudinaryAsset.js");
const {
    destroyCloudinaryAsset,
    getPrivateDownloadUrl,
} = require("../services/cloudinaryService.js");

const getRequestUserId = (req) => req.userId || req.user?._id?.toString();

const assertOwnedUserParam = (req, res, userId) => {
    const requestUserId = getRequestUserId(req);
    if (userId && userId !== requestUserId) {
        res.status(403).json({ error: "You do not have access to this user's data" });
        return false;
    }
    return true;
};

const buildTemplatePayload = (body, userId) => {
    const logoAsset = body.company?.logoAssetId || body.company?.logoAsset;

    return {
        userId,
        name: body.name,
        description: body.description,
        isDefault: Boolean(body.isDefault),
        company: {
            name: body.company?.name,
            logo: logoAsset ? undefined : body.company?.logo,
            logoAsset: logoAsset || undefined,
            address: body.company?.address,
        },
        design: {
            accentColor: body.design?.accentColor,
            showFooter: body.design?.showFooter,
            footerText: body.design?.footerText,
        },
    };
};

const addLogoAccessUrls = async (templates, userId) => {
    const list = Array.isArray(templates) ? templates : [templates];
    const assetIds = list
        .map((template) => template?.company?.logoAsset)
        .filter(Boolean);
    const assets = assetIds.length
        ? await CloudinaryAsset.find({
            _id: { $in: assetIds },
            userId,
            purpose: "template-logo",
        })
        : [];
    const assetsById = new Map(
        assets.map((asset) => [asset._id.toString(), asset])
    );

    const serialized = list.map((template) => {
        const data = template.toObject ? template.toObject() : { ...template };
        const assetId = data.company?.logoAsset;
        const asset = assetId ? assetsById.get(assetId.toString()) : null;

        if (asset) {
            data.company.logoAssetId = asset._id;
            data.company.logo = getPrivateDownloadUrl(asset);
        }

        return data;
    });

    return Array.isArray(templates) ? serialized : serialized[0];
};

const findAvailableLogoAsset = async (assetId, userId, templateId = null) => {
    if (!assetId) return null;
    if (!mongoose.isValidObjectId(assetId)) return undefined;

    return CloudinaryAsset.findOne({
        _id: assetId,
        userId,
        purpose: "template-logo",
        resourceType: "image",
        $or: [
            { linkedTemplate: null },
            ...(templateId ? [{ linkedTemplate: templateId }] : []),
        ],
    });
};

exports.createTemplate = async (req, res) => {
    try {
        const requestUserId = getRequestUserId(req);
        const templateData = buildTemplatePayload(req.body, requestUserId);
        const logoAssetId = templateData.company.logoAsset;

        if (!templateData.name) {
            return res.status(400).json({ error: "Template name is required" });
        }

        const logoAsset = await findAvailableLogoAsset(
            logoAssetId,
            req.user._id
        );
        if (logoAssetId && !logoAsset) {
            return res.status(404).json({ error: "Uploaded logo asset not found" });
        }

        if (templateData.isDefault) {
            await Template.updateMany({ userId: requestUserId }, { $set: { isDefault: false } });
        }

        const savedTemplate = await Template.create(templateData);
        if (logoAsset) {
            const linked = await CloudinaryAsset.findOneAndUpdate(
                {
                    _id: logoAsset._id,
                    userId: req.user._id,
                    linkedTemplate: null,
                },
                { $set: { linkedTemplate: savedTemplate._id } },
                { new: true }
            );
            if (!linked) {
                await savedTemplate.deleteOne();
                return res.status(409).json({ error: "Uploaded logo is already in use" });
            }
        }

        return res.status(201).json(
            await addLogoAccessUrls(savedTemplate, req.user._id)
        );
    } catch (error) {
        console.error("Failed to save template:", error);
        return res.status(500).json({ error: "Failed to save template" });
    }
};

exports.getTemplates = async (req, res) => {
    if (!assertOwnedUserParam(req, res, req.params.userId)) return;

    try {
        const templates = await Template.find({ userId: getRequestUserId(req) }).sort({ createdAt: -1 });
        return res.status(200).json(
            await addLogoAccessUrls(templates, req.user._id)
        );
    } catch (error) {
        console.error("Failed to fetch templates:", error);
        return res.status(500).json({ error: "Failed to fetch templates" });
    }
};

exports.getTemplateById = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid template ID" });
    }

    try {
        const template = await Template.findOne({
            _id: req.params.id,
            userId: getRequestUserId(req),
        });
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        return res.status(200).json(
            await addLogoAccessUrls(template, req.user._id)
        );
    } catch (error) {
        console.error("Failed to fetch template:", error);
        return res.status(500).json({ error: "Failed to fetch template" });
    }
};

exports.updateTemplate = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid template ID" });
    }

    try {
        const requestUserId = getRequestUserId(req);
        const existingTemplate = await Template.findOne({
            _id: req.params.id,
            userId: requestUserId,
        });

        if (!existingTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }

        const requestedLogoAssetId =
            req.body.company?.logoAssetId ||
            existingTemplate.company?.logoAsset;
        const logoAsset = await findAvailableLogoAsset(
            requestedLogoAssetId,
            req.user._id,
            existingTemplate._id
        );
        if (requestedLogoAssetId && !logoAsset) {
            return res.status(404).json({ error: "Uploaded logo asset not found" });
        }

        if (req.body.isDefault === true) {
            await Template.updateMany(
                { userId: requestUserId, _id: { $ne: existingTemplate._id } },
                { $set: { isDefault: false } }
            );
        }

        const updates = buildTemplatePayload(
            {
                ...existingTemplate.toObject(),
                ...req.body,
                company: {
                    ...existingTemplate.company?.toObject?.(),
                    ...(req.body.company || {}),
                },
                design: {
                    ...existingTemplate.design?.toObject?.(),
                    ...(req.body.design || {}),
                },
            },
            requestUserId
        );

        const template = await Template.findOneAndUpdate(
            { _id: req.params.id, userId: requestUserId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        const oldLogoAssetId = existingTemplate.company?.logoAsset?.toString();
        const newLogoAssetId = template.company?.logoAsset?.toString();
        if (newLogoAssetId && newLogoAssetId !== oldLogoAssetId) {
            const linked = await CloudinaryAsset.findOneAndUpdate(
                {
                    _id: newLogoAssetId,
                    userId: req.user._id,
                    linkedTemplate: null,
                },
                { $set: { linkedTemplate: template._id } },
                { new: true }
            );
            if (!linked) {
                return res.status(409).json({ error: "Uploaded logo is already in use" });
            }
            if (oldLogoAssetId) {
                await CloudinaryAsset.updateOne(
                    {
                        _id: oldLogoAssetId,
                        userId: req.user._id,
                        linkedTemplate: template._id,
                    },
                    { $set: { linkedTemplate: null } }
                );
            }
        }

        return res.status(200).json(
            await addLogoAccessUrls(template, req.user._id)
        );
    } catch (error) {
        console.error("Failed to update template:", error);
        return res.status(500).json({ error: "Failed to update template" });
    }
};

exports.deleteTemplate = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid template ID" });
    }

    try {
        const template = await Template.findOne({
            _id: req.params.id,
            userId: getRequestUserId(req),
        });
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }

        if (template.company?.logoAsset) {
            const asset = await CloudinaryAsset.findOne({
                _id: template.company.logoAsset,
                userId: req.user._id,
                linkedTemplate: template._id,
            });
            if (asset) {
                const result = await destroyCloudinaryAsset(asset);
                if (!["ok", "not found"].includes(result.result)) {
                    return res.status(502).json({ error: "Cloudinary logo deletion failed" });
                }
                await asset.deleteOne();
            }
        }

        await template.deleteOne();
        return res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Failed to delete template:", error);
        return res.status(500).json({ error: "Failed to delete template" });
    }
};
