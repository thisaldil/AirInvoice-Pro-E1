const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get('/getUserDetails/:userId', requireAuth, userController.getUserDetails);

module.exports = router;
