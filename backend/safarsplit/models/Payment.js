const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  fromMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  toType: {
    type: String,
    enum: ['POOL', 'ORGANIZER', 'MEMBER'],
    default: 'POOL'
  },
  toMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'OTHER'],
    default: 'UPI'
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
