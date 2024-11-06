// Import required dependencies
const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./user.route')
const adminRoutes = require('./admin.route')
const artistRoutes = require('./artist.route')
const notificationRoute = require('./notification.route')

// Health check endpoint to verify API is running
router.get('/health', (_, res) => {
  res.json({ status: 'running' });
});

// Define array of route configurations
const routes = [
  {
    path: '/', // Base path for user routes
    route: userRoutes,
  },
  {
    path: '/', // Base path for admin routes
    route: adminRoutes,
  },
  {
    path: '/', // Base path for artist routes
    route: artistRoutes,
  },
  {
    path: '/', // Base path for notification routes
    route: notificationRoute,
  }
];

// Register all routes with the router
routes.forEach((route) => {
  router.use(route.path, route.route);
});

// Export router for use in main application
module.exports = router;
