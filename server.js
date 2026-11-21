const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Initialize EventEmitter (listeners are registered inside events/eventEmitter.js)
require('./events/eventEmitter');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

// Import Socket.IO chat handler
const initChatSocket = require('./socket/chat');

// Initialize Express application
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket.IO chat logic
initChatSocket(io);

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve optional static files if public folder exists
app.use(express.static('public'));

// Base Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure Connect and Communication Platform API is running.',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth (signup, login, profile, admin)',
      notes: '/api/notes (CRUD operations for secure notes)'
    }
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Server Error]: ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

// Start Server (only if not required by tests)
if (process.env.NODE_ENV !== 'test_runner') {
  server.listen(PORT, () => {
    console.log(`\n===========================================================`);
    console.log(`  Secure Connect and Communication Platform Server`);
    console.log(`  Listening on port: ${PORT}`);
    console.log(`  API Base URL    : http://localhost:${PORT}`);
    console.log(`  Socket.IO       : Active and ready for connections`);
    console.log(`===========================================================\n`);
  });
}

module.exports = { app, server, io };

