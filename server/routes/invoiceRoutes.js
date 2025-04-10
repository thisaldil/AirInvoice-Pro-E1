// const express = require("express");
// const multer = require("multer");
// const { uploadInvoice } = require("../controllers/invoiceController");

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.post("/upload", upload.single("invoice"), uploadInvoice);

// module.exports = router;

const express = require("express");
const multer = require("multer");
const invoiceController = require("../controllers/invoiceController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("invoice"), invoiceController.uploadInvoice);

module.exports = router;
