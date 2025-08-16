// routes/auth.js - Clean version with try catch
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Simple test route
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Import controllers safely
let authController;
try {
  authController = require('../controllers/authController');
} catch (error) {
  console.error('Error loading auth controller:', error.message);
}

if (authController) {
  // Public routes
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  
  // Protected routes
  router.get('/me', authenticateToken, authController.getMe);
} else {
  // Fallback routes if controller fails
  router.post('/register', (req, res) => {
    res.status(500).json({ error: 'Auth controller not loaded' });
  });
  
  router.post('/login', (req, res) => {
    res.status(500).json({ error: 'Auth controller not loaded' });
  });
}

module.exports = router;