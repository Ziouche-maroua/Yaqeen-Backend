const express = require('express');
const router = express.Router();
const {
  getAllDonors,
  getDonorById,
  updateDonorProfile,
  addFavoriteFamily,
  removeFavoriteFamily,
  getFavoriteFamilies,
  getDonorDashboard
} = require('../controllers/donorController');
const { authenticateToken, requireAdmin, requireDonor } = require('../middleware/auth');

// Admin only routes
router.get('/', authenticateToken, requireAdmin, getAllDonors);
router.get('/:id', authenticateToken, requireAdmin, getDonorById);

// Donor only routes
router.get('/dashboard/me', authenticateToken, requireDonor, getDonorDashboard);
router.put('/profile', authenticateToken, requireDonor, updateDonorProfile);
router.get('/favorites', authenticateToken, requireDonor, getFavoriteFamilies);
router.post('/favorites/:familyCode', authenticateToken, requireDonor, addFavoriteFamily);
router.delete('/favorites/:familyCode', authenticateToken, requireDonor, removeFavoriteFamily);

module.exports = router;