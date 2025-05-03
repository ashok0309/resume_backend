// Load environment variables at the very top
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// Fix any URL encoded characters in MongoDB URI
if (process.env.MONGO_URI && process.env.MONGO_URI.includes('%21')) {
  process.env.MONGO_URI = process.env.MONGO_URI.replace('%21', '!');
  console.log('✅ Fixed MongoDB URI encoding for special characters');
}

// Basic validation for Mongo URI
if (!process.env.MONGO_URI || 
    (!process.env.MONGO_URI.startsWith('mongodb://') && !process.env.MONGO_URI.startsWith('mongodb+srv://'))) {
  console.error('❌ Invalid or missing MONGO_URI. It must start with "mongodb://" or "mongodb+srv://"');
  console.error('Current URI format:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 10) + '...' : 'undefined');
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/resumes', resumeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    time: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Resume API is running',
    docs: '/api/v1/resumes',
    health: '/health'
  });
});

// Debug MongoDB connection
console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI prefix:', process.env.MONGO_URI ? 
  `${process.env.MONGO_URI.split('@')[0].split('//')[0]}//${process.env.MONGO_URI.split('@')[0].split('//')[1].split(':')[0]}:****` : 'undefined');

// MongoDB connection with enhanced error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'} mode]`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Error details:', err);
  process.exit(1);
});

// Error handler - must be after all other routes
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Handle process-level errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

module.exports = app;