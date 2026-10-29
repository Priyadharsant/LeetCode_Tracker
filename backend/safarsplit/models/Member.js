const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  upiId: {
    type: String,
    default: '',
    trim: true
  },
  poolContributed: {
    type: Number,
    default: 0
  },
  totalExpenseShare: {
    type: Number,
    default: 0
  },
  directPaidOutOfPocket: {
    type: Number,
    default: 0
  },
  settledAmount: {
    type: Number,
    default: 0
  },
  isOrganizer: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Virtual net balance:
// Positive = Member has surplus/is owed back (or has remaining pool credit)
// Negative = Member has a net pending due to pay back
memberSchema.virtual('netBalance').get(function () {
  // If friend contributed 2000 to pool + paid 500 out of pocket + settled 200, and their share is 1800:
  // credit = poolContributed + directPaidOutOfPocket + settledAmount
  // debit = totalExpenseShare
  const totalCredited = (this.poolContributed || 0) + (this.directPaidOutOfPocket || 0) + (this.settledAmount || 0);
  const totalDebited = (this.totalExpenseShare || 0);
  return totalCredited - totalDebited;
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
