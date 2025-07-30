const User = require("../models/User");
const { sanitizeAvatarUrl } = require("../utils/leaderboard");
const logger = require("../utils/logger");

// POST /users - Add new user
exports.createUser = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = new User({
      name: name?.trim(),
      avatar: avatar || "",
      totalPoints: 0,
    });

    // Let mongoose handle validation
    await user.save();

    logger.info("User created successfully:", {
      userId: user._id,
      name: user.name,
    });
    res.status(201).json(user);
  } catch (error) {
    logger.error("Error creating user:", {
      error: error.message,
      name: req.body.name,
      validationErrors: error.errors,
    });

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

// GET /users - Fetch users with optional pagination
exports.getUsers = async (req, res) => {
  try {
    const { page, limit, all } = req.query;

    // If all=true or no pagination params, return all users (for dropdowns)
    if (all === "true" || (!page && !limit)) {
      const allUsers = await User.getAllRanked();
      return res.json(allUsers);
    }

    // Otherwise use pagination (for lists/tables)
    const result = await User.getRankedLeaderboard(
      parseInt(page) || 1,
      parseInt(limit) || 10
    );
    res.json(result);
  } catch (error) {
    logger.error("Error fetching users:", { error: error.message });
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
