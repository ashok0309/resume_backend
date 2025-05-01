const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// Enhanced Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Request logging
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes with versioning
app.use('/api/v1/resumes', resumeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ 
    error: true, 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// MongoDB connection with options
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Server start
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // Exit process with failure
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

module.exports = app; // Export for testing