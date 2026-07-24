const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Profile routes
router.get('/', profileController.getProfile);
router.get('/search', profileController.searchProfiles);
router.post('/update', profileController.updateProfile);
router.post('/complete-session', profileController.completeSession);
router.get('/transactions', profileController.getTransactions);

// Session Requests routes
router.get('/session-requests', profileController.getSessionRequests);
router.post('/session-requests', profileController.createSessionRequest);
router.post('/session-requests/update', profileController.updateSessionRequestStatus);

// Virtual Video Sessions routes
router.get('/active-sessions', profileController.getActiveSessions);
router.get('/session-details', profileController.getSessionDetails);

module.exports = router;
