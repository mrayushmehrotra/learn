const User = require("../models/User");
const logger = require("../utils/logger");

// GET /leaderboard - Get paginated leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1); // Ensure minimum page is 1
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Limit between 1 and 100

    logger.info("Fetching leaderboard", { page, limit });
    const result = await User.getRankedLeaderboard(page, limit);

    // Cache headers for brief period
    res.set("Cache-Control", "public, max-age=60"); // Cache for 1 minute
    res.json(result);
  } catch (error) {
    logger.error("Error fetching leaderboard:", { error: error.message });
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
