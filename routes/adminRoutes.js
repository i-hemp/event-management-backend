const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All routes require Admin privileges
router.use(verifyToken, isAdmin);

router.delete('/clear-events', adminController.clearAllEvents);
router.delete('/clear-users', adminController.clearAllUsers);
router.delete('/clear-organizers', adminController.clearAllOrganizers);

module.exports = router;
