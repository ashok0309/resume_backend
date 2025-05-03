const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/v1/resumes
 * @desc    Create a new resume
 * @access  Public
 */
router.post('/', 
  // Request Validation
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Email is invalid'),
  async (req, res, next) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array()
        });
      }

      // Create and save the resume
      const newResume = new Resume(req.body);
      const savedResume = await newResume.save();
    
      res.status(201).json({
        success: true,
        message: 'Resume created successfully',
        data: savedResume
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: Object.values(err.errors).map(e => e.message)
        });
      }
      next(err); // Pass to error handler middleware
    }
  }
);

/**
 * @route   GET /api/v1/resumes
 * @desc    Get all resumes with optional pagination
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const resumes = await Resume.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JS objects for better performance

    // Get total count for pagination info
    const total = await Resume.countDocuments();

    res.status(200).json({
      success: true,
      count: resumes.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: resumes
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/v1/resumes/:id
 * @desc    Get a resume by ID
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    next(err);
  }
});

/**
 * @route   PUT /api/v1/resumes/:id
 * @desc    Update a resume by ID
 * @access  Public
 */
router.put('/:id', async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Update data is required' 
      });
    }

    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      data: resume
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    next(err);
  }
});

/**
 * @route   DELETE /api/v1/resumes/:id
 * @desc    Delete a resume by ID
 * @access  Public
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);

    if (!resume) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    next(err);
  }
});

module.exports = router;
