// Import required HTTP status codes and models
const { OK, INTERNAL_SERVER_ERROR } = require("http-status");
const { NotificatonModel, User } = require("../models");

/**
 * Get count of unread notifications for a user
 * @param {Object} req - Express request object containing user claims
 * @param {Object} res - Express response object
 * @returns {Object} Response with notification count or error
 */
const getNotificationRoute = async (req,res) => {
    // Extract user info from request claims
    const user = req.claims;

    // Find user in database
    const userData = await User.findOne({ _id: user.userId });
    if (!userData) {
        // If the user is not found, send an error response
        return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
    }

    try {
        // Count number of unread notifications for the user
        const result = await NotificatonModel.countDocuments({
            recipient: userData._id, 
            isRead: false 
        });

        // Return success response with notification count
        return res.status(OK).json({notificationCount:result})
    } catch (error) {
        // Return error response if operation fails
        return res.status(INTERNAL_SERVER_ERROR).json({error})
    }
}

// Export the notification route handler
module.exports = {
    getNotificationRoute
}