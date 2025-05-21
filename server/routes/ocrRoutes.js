const express = require('express');
const multer = require('multer');
const path = require('path');
const { handleOCR } = require('../controllers/ocrController');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../uploads') });

router.post('/analyze', upload.single('ticket'), handleOCR);

module.exports = router;
