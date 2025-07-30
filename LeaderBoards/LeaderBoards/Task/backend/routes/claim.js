const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

// @route   POST api/claim
// @desc    Claim points for a user
// @access  Public
router.post('/', claimController.claimPoints);

module.exports = router; 