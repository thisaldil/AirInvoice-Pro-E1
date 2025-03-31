const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/google', authController.authenticateGoogle);
router.get('/google/callback', authController.handleGoogleRedirect);

module.exports = router;
