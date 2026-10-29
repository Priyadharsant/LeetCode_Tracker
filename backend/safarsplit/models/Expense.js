const mongoose = require('mongoose');

const payerItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['POOL', 'ORGANIZER', 'MEMBER'],
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  },
  memberName: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

const splitItemSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  memberName: {
    type: String,
    default: ''
  },
  shareAmount: {
    type: Number,
    required: true
  }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Snacks', 'Travel', 'Stay', 'Sightseeing', 'Shopping', 'Emergency', 'Other'],
    default: 'Food'
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  payerType: {
    type: String,
    enum: ['POOL', 'ORGANIZER', 'MEMBER', 'MULTI'],
    default: 'POOL'
  },
  payers: [payerItemSchema],
  splits: [splitItemSchema],
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
