const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/getUserDetails/:userId', userController.getUserDetails);

module.exports = router;
