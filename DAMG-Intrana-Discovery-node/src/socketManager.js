// Socket.io instance
let io;

/**
 * Initialize Socket.IO server with CORS configuration
 * @param {Object} server - HTTP/HTTPS server instance
 */
function initSocket(server) {
    io = require('socket.io')(server, {
        cors: {
            origin: "*" // Allow all origins
        }
    });

    // Handle new socket connections
    io.on("connection", (socket) => {
        // Listen for new user connections
        socket.on("newUser", (userId) => {
            addNewUser(userId, socket.id);
        });

        // Your other event handlers

        // Handle socket disconnections
        socket.on("disconnect", () => {
            removeUser(socket.id);
        });
    });
}

// Array to store online user information
let onlineUsers = [];

/**
 * Add a new user to online users list
 * @param {string} userId - User's unique identifier
 * @param {string} socketId - Socket connection ID
 */
const addNewUser = (userId, socketId) => {
    console.log('User connected:', userId);

    // Remove user if already exists (refresh, reconnection, etc.)
    removeUser(socketId);

    onlineUsers.push({ userId, socketId });
    console.log('All connected Users:', onlineUsers);
};

/**
 * Remove a user from online users list
 * @param {string} socketId - Socket connection ID to remove
 */
const removeUser = (socketId) => {
    console.log('User disconnected:', socketId);
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
    console.log('All connected Users:', onlineUsers);
};

/**
 * Find a user by their userId
 * @param {string} userId - User's unique identifier
 * @returns {Object|undefined} User object if found
 */
const getUser = (userId) => {
    return onlineUsers.find((user) => user.userId === userId);
};

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 * @throws {Error} If Socket.IO is not initialized
 */
function getIo() {
    if (!io) {
        throw new Error('Socket.IO is not initialized. Call initSocket first.');
    }
    return io;
}

/**
 * Send a notification to a specific user
 * @param {string} userId - Target user's unique identifier
 * @param {string} message - Notification message to send
 * @throws {string} If user is not found
 */
function sendNotification(userId, message) {
    const user = getUser(userId);
    if (user) {
        getIo()?.to(user.socketId)?.emit('notification', message);
    } else {
        throw 'User not found';
    }
}

// Export required functions
module.exports = {
    initSocket,
    getIo,
    getUser,
    sendNotification
};
