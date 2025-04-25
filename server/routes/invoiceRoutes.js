const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const ticketController = require('../controllers/ticketController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  // Allow only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post('/upload-ticket', upload.single('ticket'), ticketController.extractTicketData);
router.post("/upload", upload.single("invoice"), invoiceController.uploadInvoice);
router.post('/sendInvoiceEmail', invoiceController.sendInvoiceEmail);
router.post('/saveInvoiceDetails', invoiceController.saveInvoiceDetails);
router.get('/getInvoiceDetailsByUserId/:userId', invoiceController.getInvoiceDetailsByUserId);
router.get('/getInvoiceDetailsByInvoiceId/:invoiceId', invoiceController.getInvoiceDetailsByInvoiceId);
router.delete('/deleteInvoice/:invoiceId', invoiceController.deleteInvoice);

module.exports = router;
