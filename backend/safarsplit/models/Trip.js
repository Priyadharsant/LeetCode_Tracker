const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: '₹'
  },
  organizerUpi: {
    type: String,
    default: ''
  },
  organizerName: {
    type: String,
    default: 'Organizer'
  },
  initialPoolPerMember: {
    type: Number,
    default: 0
  },
  totalPoolCollected: {
    type: Number,
    default: 0
  },
  totalPoolSpent: {
    type: Number,
    default: 0
  },
  totalTripSpent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED'],
    default: 'ACTIVE'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Virtual for remaining in-hand cash
tripSchema.virtual('inHandPoolCash').get(function () {
  return Math.max(0, (this.totalPoolCollected || 0) - (this.totalPoolSpent || 0));
});

tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
