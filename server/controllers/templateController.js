const mongoose = require("mongoose");
const Template = require("../models/Template.js");

const getRequestUserId = (req) => req.userId || req.user?._id?.toString();

const assertOwnedUserParam = (req, res, userId) => {
    const requestUserId = getRequestUserId(req);
    if (userId && userId !== requestUserId) {
        res.status(403).json({ error: "You do not have access to this user's data" });
        return false;
    }
    return true;
};

const buildTemplatePayload = (body, userId) => ({
    userId,
    name: body.name,
    description: body.description,
    isDefault: Boolean(body.isDefault),
    company: {
        name: body.company?.name,
        logo: body.company?.logo,
        address: body.company?.address,
    },
    design: {
        accentColor: body.design?.accentColor,
        showFooter: body.design?.showFooter,
        footerText: body.design?.footerText,
    },
});

exports.createTemplate = async (req, res) => {
    try {
        const requestUserId = getRequestUserId(req);
        const templateData = buildTemplatePayload(req.body, requestUserId);

        if (!templateData.name) {
            return res.status(400).json({ error: "Template name is required" });
        }

        if (templateData.isDefault) {
            await Template.updateMany({ userId: requestUserId }, { $set: { isDefault: false } });
        }

        const savedTemplate = await Template.create(templateData);
        return res.status(201).json(savedTemplate);
    } catch (error) {
        console.error("Failed to save template:", error);
        return res.status(500).json({ error: "Failed to save template" });
    }
};

exports.getTemplates = async (req, res) => {
    if (!assertOwnedUserParam(req, res, req.params.userId)) return;

    try {
        const templates = await Template.find({ userId: getRequestUserId(req) }).sort({ createdAt: -1 });
        return res.status(200).json(templates);
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
        return res.status(200).json(template);
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

        return res.status(200).json(template);
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
        const template = await Template.findOneAndDelete({
            _id: req.params.id,
            userId: getRequestUserId(req),
        });
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        return res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Failed to delete template:", error);
        return res.status(500).json({ error: "Failed to delete template" });
    }
};
