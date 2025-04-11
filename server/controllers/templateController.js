const User = require("../models/User");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");
const Template = require("../models/Template.js");

//save template
exports.createTemplate = async (req, res) => {
    try {
        const newTemplate = new Template(req.body);
        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        res.status(500).json({ error: "Failed to save template" });
    }
};

//get all templates by user id
exports.getTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ userId: req.params.userId });
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch templates" });
    }
};

//get template by id
exports.getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch template" });
    }
};

//update template by id
exports.updateTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ error: "Failed to update template" });
    }
}

//delete template by id
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete template" });
    }
}