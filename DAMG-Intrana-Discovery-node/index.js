// Importing required modules and configurations
const mongoose = require('mongoose');
const http = require('./app');
const config = require('./src/config/config');
const { initSocket } = require('./src/socketManager');
let server;

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  server = http.listen(config.port, console.info('started app on port: ', config.port));
  initSocket(server)
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.log('error: ', error);
  exitHandler();
};

// index.js

const express = require('express');
const app = express();
const tokenGatedServiceRouter = require('./src/token-gated-service');

app.use('/api', tokenGatedServiceRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  if (server) {
    server.close();
  }
});

module.exports = server