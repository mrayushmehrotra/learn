const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// @route   GET api/users
// @desc    Get all users
// @access  Public
router.get('/', usersController.getUsers);
router.post('/', usersController.createUser); // <-- Add this line

module.exports = router; 