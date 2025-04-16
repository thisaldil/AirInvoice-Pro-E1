const express = require("express");
const multer = require("multer");
const invoiceController = require("../controllers/invoiceController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("invoice"), invoiceController.uploadInvoice);
router.post('/sendInvoiceEmail', invoiceController.sendInvoiceEmail);
router.post('/saveInvoiceDetails', invoiceController.saveInvoiceDetails);
router.get('/getInvoiceDetailsByUserId/:userId', invoiceController.getInvoiceDetailsByUserId);
router.get('/getInvoiceDetailsByInvoiceId/:invoiceId', invoiceController.getInvoiceDetailsByInvoiceId);
router.delete('/deleteInvoice/:invoiceId', invoiceController.deleteInvoice);

module.exports = router;
