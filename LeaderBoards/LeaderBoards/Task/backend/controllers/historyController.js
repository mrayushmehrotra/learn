const ClaimHistory = require('../models/ClaimHistory');

// GET /api/history/:userId
exports.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const history = await ClaimHistory.find({ userId }).sort({ timestamp: -1 });
    const formatted = history.map(record => ({
      claimedPoints: record.claimedPoints,
      timestamp: record.timestamp.toISOString()
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 