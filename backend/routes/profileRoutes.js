const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Profile routes
router.get('/', profileController.getProfile);
router.get('/search', profileController.searchProfiles);
router.post('/update', profileController.updateProfile);
router.post('/complete-session', profileController.completeSession);

// Session Requests routes
router.get('/session-requests', profileController.getSessionRequests);
router.post('/session-requests', profileController.createSessionRequest);
router.post('/session-requests/update', profileController.updateSessionRequestStatus);

module.exports = router;
