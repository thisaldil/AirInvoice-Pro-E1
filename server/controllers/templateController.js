const User = require("../models/User");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");
const Template = require("../models/Template.js");

exports.createTemplate = async (req, res) => {
    try {
        const newTemplate = new Template(req.body);
        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        res.status(500).json({ error: "Failed to save template" });
    }
};
