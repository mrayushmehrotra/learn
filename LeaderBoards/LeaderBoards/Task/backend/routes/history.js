const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// @route   GET api/history/:userId
// @desc    Get claim history for a user
// @access  Public
router.get('/:userId', historyController.getUserHistory);

module.exports = router; 