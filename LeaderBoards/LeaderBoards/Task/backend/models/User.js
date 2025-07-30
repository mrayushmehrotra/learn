const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  avatarUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Add static method for leaderboard
userSchema.statics.getRankedLeaderboard = async function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const users = await this.find({})
    .sort({ totalPoints: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add rank to each user
  const allUsers = await this.find({}).sort({ totalPoints: -1 }).lean();
  const userRanks = {};
  allUsers.forEach((user, idx) => {
    userRanks[user._id.toString()] = idx + 1;
  });

  const usersWithRank = users.map(user => ({
    ...user,
    rank: userRanks[user._id.toString()] || null
  }));

  return {
    users: usersWithRank,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(allUsers.length / limit),
      totalUsers: allUsers.length,
      hasNextPage: page * limit < allUsers.length,
      hasPrevPage: page > 1
    }
  };
};

module.exports = mongoose.model('User', userSchema); 