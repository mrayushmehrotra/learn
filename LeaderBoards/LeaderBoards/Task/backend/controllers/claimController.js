const User = require('../models/User');
const ClaimHistory = require('../models/ClaimHistory');

// POST /api/claim
exports.claimPoints = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Random points between 1 and 10
    const points = Math.floor(Math.random() * 10) + 1;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalPoints: points } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Log claim
    await ClaimHistory.create({
      userId,
      claimedPoints: points
    });

    // Get updated leaderboard
    const users = await User.find().sort({ totalPoints: -1 });
    const leaderboard = users.map((u, idx) => ({
      _id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      totalPoints: u.totalPoints,
      rank: idx + 1
    }));

    // Find updated user in leaderboard
    const updatedUser = leaderboard.find(u => u._id.toString() === userId);

    res.json({
      user: updatedUser,
      claimedPoints: points,
      leaderboard
    });
  } catch (err) {
    console.error('Error claiming points:', err);
    res.status(500).json({ error: 'Server error' });
  }
}; 