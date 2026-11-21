const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getProfile,
  adminDashboard
} = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public authentication routes
router.post('/signup', signup);
router.post('/login', login);

// Protected user profile route (Requires valid JWT)
router.get('/profile', authenticateToken, getProfile);

// Protected admin-only route (Requires valid JWT + admin role)
router.get('/admin', authenticateToken, authorizeRoles('admin'), adminDashboard);

module.exports = router;

