const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Profile routes
router.get('/', profileController.getProfile);
router.get('/search', profileController.searchProfiles);
router.post('/update', profileController.updateProfile);
router.post('/complete-session', profileController.completeSession);

module.exports = router;
