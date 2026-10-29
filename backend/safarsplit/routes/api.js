const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// Helper to generate a random 6-character trip code if not provided
function generateTripCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. Create a new trip
router.post('/trips', async (req, res) => {
  try {
    let { title, destination, currency, organizerUpi, organizerName, initialPoolPerMember, members, tripCode } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Trip title is required' });
    }

    if (!tripCode) {
      tripCode = generateTripCode();
    } else {
      tripCode = tripCode.trim().toUpperCase();
    }

    const existing = await Trip.findOne({ tripCode });
    if (existing) {
      tripCode = `${tripCode}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const trip = new Trip({
      tripCode,
      title,
      destination: destination || '',
      currency: currency || '₹',
      organizerUpi: organizerUpi || '',
      organizerName: organizerName || 'Host',
      initialPoolPerMember: Number(initialPoolPerMember) || 0
    });

    await trip.save();

    // Create Organizer Member
    const orgMember = new Member({
      tripId: trip._id,
      name: organizerName || 'You (Host)',
      upiId: organizerUpi || '',
      isOrganizer: true,
      poolContributed: Number(initialPoolPerMember) || 0
    });
    await orgMember.save();

    let createdMembers = [orgMember];
    let totalCollected = Number(initialPoolPerMember) || 0;

    // Create other members if provided
    if (Array.isArray(members) && members.length > 0) {
      for (const m of members) {
        if (!m.name || m.name.trim() === '') continue;
        const initialContr = m.poolContributed !== undefined ? Number(m.poolContributed) : (Number(initialPoolPerMember) || 0);
        totalCollected += initialContr;

        const newMem = new Member({
          tripId: trip._id,
          name: m.name.trim(),
          phone: m.phone || '',
          upiId: m.upiId || '',
          isOrganizer: false,
          poolContributed: initialContr
        });
        await newMem.save();
        createdMembers.push(newMem);
      }
    }

    trip.totalPoolCollected = totalCollected;
    await trip.save();

    res.status(201).json({
      success: true,
      trip,
      members: createdMembers
    });
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. List all trips
router.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single trip details with members and expenses
router.get('/trips/:tripCode', async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const members = await Member.find({ tripId: trip._id });
    const expenses = await Expense.find({ tripId: trip._id }).sort({ date: -1 });
    const payments = await Payment.find({ tripId: trip._id }).sort({ date: -1 });

    res.json({
      trip,
      members,
      expenses,
      payments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Add member to trip
router.post('/trips/:tripCode/members', async (req, res) => {
  try {
    const trip = await Trip.findOne({ tripCode: req.params.tripCode.toUpperCase() });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { name, phone, upiId, poolContributed } = req.body;
    if (!name) return res.status(400).json({ error: 'Member name is required' });

    const initialContribution = Number(poolContributed) || 0;

    const member = new Member({
      tripId: trip._id,
      name: name.trim(),
      phone: phone || '',
      upiId: upiId || '',
      poolContributed: initialContribution
    });

    await member.save();

    if (initialContribution > 0) {
      trip.totalPoolCollected = (trip.totalPoolCollected || 0) + initialContribution;
      await trip.save();
    }

    res.status(201).json({ success: true, member, trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Add Expense to trip
router.post('/trips/:tripCode/expenses', async (req, res) => {
  try {
    const trip = await Trip.findOne({ tripCode: req.params.tripCode.toUpperCase() });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { title, amount, category, location, notes, payerType, payers, splits } = req.body;
    const expAmount = Number(amount);
    if (!title || !expAmount || expAmount <= 0) {
      return res.status(400).json({ error: 'Title and valid amount required' });
    }

    const expense = new Expense({
      tripId: trip._id,
      title: title.trim(),
      amount: expAmount,
      category: category || 'Food',
      location: location || '',
      notes: notes || '',
      payerType: payerType || 'POOL',
      payers: payers || [],
      splits: splits || []
    });

    await expense.save();

    // 1. Update Trip Totals
    trip.totalTripSpent = (trip.totalTripSpent || 0) + expAmount;

    // 2. If paid by POOL or partial POOL
    if (payerType === 'POOL') {
      trip.totalPoolSpent = (trip.totalPoolSpent || 0) + expAmount;
    } else if (payerType === 'MULTI' && Array.isArray(payers)) {
      for (const p of payers) {
        if (p.type === 'POOL') {
          trip.totalPoolSpent = (trip.totalPoolSpent || 0) + (Number(p.amount) || 0);
        } else if (p.type === 'MEMBER' && p.memberId) {
          await Member.findByIdAndUpdate(p.memberId, {
            $inc: { directPaidOutOfPocket: Number(p.amount) || 0 }
          });
        }
      }
    } else if (payerType === 'MEMBER' && payers?.[0]?.memberId) {
      await Member.findByIdAndUpdate(payers[0].memberId, {
        $inc: { directPaidOutOfPocket: expAmount }
      });
    }

    await trip.save();

    // 3. Update splits for each member
    if (Array.isArray(splits) && splits.length > 0) {
      for (const s of splits) {
        if (s.memberId) {
          await Member.findByIdAndUpdate(s.memberId, {
            $inc: { totalExpenseShare: Number(s.shareAmount) || 0 }
          });
        }
      }
    }

    res.status(201).json({ success: true, expense, trip });
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Record Pool Top-Up or Direct Payment
router.post('/trips/:tripCode/pool', async (req, res) => {
  try {
    const trip = await Trip.findOne({ tripCode: req.params.tripCode.toUpperCase() });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { memberId, amount, paymentMethod, notes } = req.body;
    const paymentAmount = Number(amount);
    if (!memberId || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Member and valid amount required' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const payment = new Payment({
      tripId: trip._id,
      fromMemberId: member._id,
      toType: 'POOL',
      amount: paymentAmount,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || 'Pool top-up'
    });
    await payment.save();

    // Update member pool contribution & trip pool collected
    member.poolContributed = (member.poolContributed || 0) + paymentAmount;
    await member.save();

    trip.totalPoolCollected = (trip.totalPoolCollected || 0) + paymentAmount;
    await trip.save();

    res.status(201).json({ success: true, payment, member, trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Settle dues between members
router.post('/trips/:tripCode/settle', async (req, res) => {
  try {
    const trip = await Trip.findOne({ tripCode: req.params.tripCode.toUpperCase() });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { fromMemberId, toMemberId, amount, notes } = req.body;
    const settleAmount = Number(amount);
    if (!fromMemberId || !settleAmount || settleAmount <= 0) {
      return res.status(400).json({ error: 'Invalid settlement data' });
    }

    const payment = new Payment({
      tripId: trip._id,
      fromMemberId,
      toType: toMemberId ? 'MEMBER' : 'ORGANIZER',
      toMemberId: toMemberId || null,
      amount: settleAmount,
      paymentMethod: 'UPI',
      notes: notes || 'Settlement'
    });
    await payment.save();

    await Member.findByIdAndUpdate(fromMemberId, {
      $inc: { settledAmount: settleAmount }
    });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Bulk Sync (Offline to Online sync for Android)
router.post('/trips/:tripCode/sync', async (req, res) => {
  try {
    const { tripData, membersData, expensesData } = req.body;
    const tripCode = req.params.tripCode.toUpperCase();

    let trip = await Trip.findOne({ tripCode });
    if (!trip && tripData) {
      trip = new Trip({ ...tripData, tripCode });
      await trip.save();
    }

    if (Array.isArray(membersData)) {
      for (const m of membersData) {
        if (m._id) {
          await Member.findByIdAndUpdate(m._id, m, { upsert: true });
        } else {
          await Member.create({ ...m, tripId: trip._id });
        }
      }
    }

    if (Array.isArray(expensesData)) {
      for (const e of expensesData) {
        if (e._id) {
          await Expense.findByIdAndUpdate(e._id, e, { upsert: true });
        } else {
          await Expense.create({ ...e, tripId: trip._id });
        }
      }
    }

    const updatedTrip = await Trip.findOne({ tripCode });
    const members = await Member.find({ tripId: updatedTrip._id });
    const expenses = await Expense.find({ tripId: updatedTrip._id }).sort({ date: -1 });

    res.json({ success: true, trip: updatedTrip, members, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. In-App Updater Release Check
router.get('/version/latest', (req, res) => {
  res.json({
    versionCode: 1,
    versionName: "1.0.0",
    releaseNotes: "Initial release of SafarSplit with Trip Pool, UPI intents, and WhatsApp sharing!",
    downloadUrl: "https://github.com/Priyan/SafarSplit/releases/latest/download/app-release.apk",
    mandatory: false
  });
});

module.exports = router;
