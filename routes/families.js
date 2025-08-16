// routes/families.js - Clean version
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireAdminOrFamily } = require('../middleware/auth');

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'Family routes working' });
});

// Import controller safely
let familyController;
try {
  familyController = require('../controllers/familyController');
} catch (error) {
  console.error('Error loading family controller:', error.message);
}

if (familyController) {
  // Public routes - replace the test route
  router.get('/', familyController.getAllFamilies);
  router.get('/:familyCode', familyController.getFamilyByCode);
  
  // Protected routes
  router.post('/', authenticateToken, requireAdminOrFamily, familyController.createFamily);
  router.put('/:familyCode/verify', authenticateToken, requireAdmin, familyController.verifyFamily);
  router.get('/:familyCode/secure', authenticateToken, requireAdmin, familyController.getSecureFamilyData);
} else {
  // Keep the test route if controller fails
  console.log('Family controller not loaded, using test routes');
}

module.exports = router;