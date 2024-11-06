// Import node-cron library for scheduling tasks
const cron = require('node-cron');

// Import updateIsLaunchCollection function from artist service
// This function updates the launch status of collections
const { updateIsLaunchCollection } = require('../services/artist.service');
// Schedule a cron job to run every 5 minutes
cron.schedule('* * * * *', () => {
    // Place your code or task to run every 5 minutes here
    updateIsLaunchCollection()
    console.log('cron job work!!!!!!!!');
});
