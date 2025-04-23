const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const ticketController = require('../controllers/ticketController');

// Configure file upload
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
  const upload = multer({ storage });

  router.post('/upload-ticket', upload.single('ticket'), ticketController.extractTicketData);
router.post("/upload", upload.single("invoice"), invoiceController.uploadInvoice);
router.post('/sendInvoiceEmail', invoiceController.sendInvoiceEmail);
router.post('/saveInvoiceDetails', invoiceController.saveInvoiceDetails);
router.get('/getInvoiceDetailsByUserId/:userId', invoiceController.getInvoiceDetailsByUserId);
router.get('/getInvoiceDetailsByInvoiceId/:invoiceId', invoiceController.getInvoiceDetailsByInvoiceId);
router.delete('/deleteInvoice/:invoiceId', invoiceController.deleteInvoice);

module.exports = router;
