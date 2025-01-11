const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001; // Ensure this port matches your backend configuration

app.use(cors());
app.use(express.json());

app.get('/api/token-gated-service', (req, res) => {
    const { address } = req.query;

    // Placeholder logic for token verification
    const tokenOwned = verifyOwnership(address); // This should be your actual token verification logic

    if (tokenOwned) {
        res.status(200).send('Access granted to token-gated service');
    } else {
        res.status(403).send('Access denied');
    }
});

// Function to verify token ownership (replace with actual logic)
function verifyOwnership(address) {
    // Dummy logic: Replace with actual verification using blockchain data
    const validAddresses = ['0x123...', '0x456...']; // Replace with actual addresses
    return validAddresses.includes(address);
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});