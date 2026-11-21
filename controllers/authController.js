const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEventEmitter = require('../events/eventEmitter');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: username, email, and password are required fields.'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please provide a valid email address.'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Password must be at least 6 characters long.'
      });
    }

    // Check if email already exists (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Validate role if specified
    const assignedRole = role && ['user', 'admin'].includes(role.toLowerCase())
      ? role.toLowerCase()
      : 'user';

    // Hash password using bcrypt (10 rounds salt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole
    });

    // Trigger registration domain event
    appEventEmitter.emit('user_registered', {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during signup.',
      error: error.message
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: email and password are required.'
      });
    }

    // Find user by normalized email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password with bcrypt.compare()
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Trigger login domain event
    appEventEmitter.emit('user_logged_in', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message
    });
  }
};

/**
 * @desc    Get authenticated user's profile
 * @route   GET /api/auth/profile
 * @access  Private (JWT required)
 */
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile.',
      error: error.message
    });
  }
};

/**
 * @desc    Admin-only dashboard route (RBAC test)
 * @route   GET /api/auth/admin
 * @access  Private (Admin role required)
 */
const adminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    return res.status(200).json({
      success: true,
      message: 'Welcome to the Admin Protected Area. Access granted.',
      adminUser: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      },
      systemInfo: {
        totalRegisteredUsers: totalUsers,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error accessing admin resource.',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  adminDashboard
};

