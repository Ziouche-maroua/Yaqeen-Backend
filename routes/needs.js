// routes/needs.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdminOrFamily } = require('../middleware/auth');

let needController;
try {
  needController = require('../controllers/needController');
} catch (error) {
  console.error('Error loading need controller:', error.message);
}

if (needController) {
  // Public route
  router.get('/', needController.getAllNeeds);

  // Protected routes
  router.post('/', authenticateToken, requireAdminOrFamily, needController.createNeed);
  router.put('/:id/fulfill', authenticateToken, needController.fulfillNeed);
} else {
  // fallback test route
  router.get('/', (req, res) => {
    res.json({ message: 'Need routes working (controller not loaded)' });
  });
}

module.exports = router;
