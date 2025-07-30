const User = require('../models/User');

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    // Add rank and only return required fields
    const usersWithRank = users.map((user, idx) => ({
      _id: user._id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      totalPoints: user.totalPoints,
      rank: idx + 1
    }));
    res.json(usersWithRank);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
}; 


exports.createUser = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const user = new User({
      name,
      avatarUrl: avatarUrl || '', // fallback if not provided
      totalPoints: 0,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};