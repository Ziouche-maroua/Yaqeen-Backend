const express = require('express');
const router = express.Router();
const {
  addExternalDonation,
  getFamilyDonations,
  verifyDonation,
  getDonationStats
} = require('../controllers/donationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/family/:familyCode', getFamilyDonations);
router.get('/stats', getDonationStats);

// Protected routes
router.post('/', authenticateToken, addExternalDonation);
router.put('/:id/verify', authenticateToken, requireAdmin, verifyDonation);

module.exports = router;