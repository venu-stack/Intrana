// Importing the express module
const express = require('express');
// Creating a new router instance
const router = express.Router();
// Importing the fixedPriceSaleController from the eventController
const fixedPriceSaleController = require('../controllers/eventController');

// Creating a new route for handling the listNFTForFixedSale event
router.post('/listNFTForFixedSale', fixedPriceSaleController.handleListNFTForFixedSaleEvent);

// Exporting the router
module.exports = router;
