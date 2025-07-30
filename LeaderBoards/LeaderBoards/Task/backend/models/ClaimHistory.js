const mongoose = require('mongoose');

const claimHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedPoints: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

claimHistorySchema.index({ userId: 1 });

module.exports = mongoose.model('ClaimHistory', claimHistorySchema); 