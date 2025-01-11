const FixedPriceSale = require('../models/EventModel');

// Function to handle listNFTForFixedSale event
const handleListNFTForFixedSaleEvent = async (req, res) => {
    try {
        // Get event data and store it in the database
        const eventData = req.body;
        const fixedPriceSale = new FixedPriceSale(eventData);
        await fixedPriceSale.save();
        res.status(201).json({ message: 'Event data stored successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    handleListNFTForFixedSaleEvent,
};
