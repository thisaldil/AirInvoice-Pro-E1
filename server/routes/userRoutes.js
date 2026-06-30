const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get('/me', requireAuth, userController.getUserDetails);
router.get('/getUserDetails/:userId', requireAuth, userController.getUserDetails);

module.exports = router;
