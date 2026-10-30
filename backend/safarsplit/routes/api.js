const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { createTripToken, createMemberToken } = require('../utils/cryptoHelper');

function getBaseUrl(req) {
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}`;
}

const JWT_SECRET = process.env.JWT_SECRET || 'safarsplit_secure_jwt_secret_2026';

// Middleware: extract JWT user if present
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
}

// Middleware: require authentication
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: 'Session expired or invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Apply token extraction across all routes
router.use(authenticateToken);

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// 1. User Sign Up
router.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone ? phone.trim() : ''
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. User Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Current User Profile
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// APP VERSION & AUTO-RELEASE ROUTES
// ==========================================

router.get('/release/latest', (req, res) => {
  try {
    const versionFile = path.join(__dirname, '../releases/version.json');
    if (fs.existsSync(versionFile)) {
      const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      data.apkUrl = `${protocol}://${host}/api/release/download`;
      return res.json(data);
    }
    res.status(404).json({ error: 'No release information found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/release/download', (req, res) => {
  try {
    const apkPath = path.join(__dirname, '../releases/app-latest.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="safarsplit-latest.apk"');
      return res.sendFile(apkPath);
    }
    res.status(404).json({ error: 'Release APK not found on server' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
      userId: req.user ? req.user.id : null,
      tripCode,
      title,
      destination: destination || '',
      currency: currency || '₹',
      organizerUpi: organizerUpi || '',
      organizerName: organizerName || (req.user ? req.user.name : 'Host'),
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

// 2. List user-specific trips
router.get('/trips', async (req, res) => {
  try {
    const query = req.user ? { userId: req.user.id } : {};
    const trips = await Trip.find(query).sort({ createdAt: -1 });
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
      payments,
      shareToken: createTripToken(trip.tripCode),
      shareUrl: `${getBaseUrl(req)}/s/${createTripToken(trip.tripCode)}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3a. Get encrypted share token for trip
router.get('/trips/:tripCode/share-token', async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const token = createTripToken(trip.tripCode);
    const baseUrl = getBaseUrl(req);
    res.json({
      tripCode: trip.tripCode,
      shareToken: token,
      shareUrl: `${baseUrl}/s/${token}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3b. Get encrypted share token for individual member passbook
router.get('/trips/:tripCode/members/:memberId/share-token', async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    const token = createMemberToken(trip.tripCode, member._id.toString());
    const baseUrl = getBaseUrl(req);
    res.json({
      tripCode: trip.tripCode,
      memberId: member._id,
      shareToken: token,
      shareUrl: `${baseUrl}/s/${token}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3b. Update trip details (organizerUpi, title, destination)
router.put('/trips/:tripCode', async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const { title, destination, organizerUpi, organizerName } = req.body;
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (destination !== undefined) updateData.destination = destination.trim();
    if (organizerUpi !== undefined) updateData.organizerUpi = organizerUpi.trim();
    if (organizerName !== undefined) updateData.organizerName = organizerName.trim();

    const trip = await Trip.findOneAndUpdate({ tripCode }, updateData, { new: true });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Also update organizer member's upiId / name if changed
    if (organizerUpi !== undefined || organizerName !== undefined) {
      const memUpdate = {};
      if (organizerUpi !== undefined) memUpdate.upiId = organizerUpi.trim();
      if (organizerName !== undefined) memUpdate.name = organizerName.trim();
      await Member.findOneAndUpdate({ tripId: trip._id, isOrganizer: true }, memUpdate);
    }

    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3c. Delete trip and all related data (members, expenses, payments)
router.delete('/trips/:tripCode', async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Cascade delete members, expenses, and payments
    await Member.deleteMany({ tripId: trip._id });
    await Expense.deleteMany({ tripId: trip._id });
    await Payment.deleteMany({ tripId: trip._id });
    await Trip.deleteOne({ _id: trip._id });

    res.json({ success: true, message: `Trip ${tripCode} and all related records deleted successfully` });
  } catch (err) {
    console.error('Error deleting trip:', err);
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

// 4b. Update member details (name, phone, upiId)
router.put('/trips/:tripCode/members/:memberId', async (req, res) => {
  try {
    const { name, phone, upiId } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (upiId !== undefined) updateData.upiId = upiId.trim();

    const member = await Member.findByIdAndUpdate(req.params.memberId, updateData, { new: true });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json({ success: true, member });
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

    // Helper to resolve organizer member if 'ORGANIZER' passed as id
    let organizerMember = null;
    async function resolveMemberId(mId) {
      if (!mId) return null;
      if (mId === 'ORGANIZER') {
        if (!organizerMember) {
          organizerMember = await Member.findOne({ tripId: trip._id, isOrganizer: true });
        }
        return organizerMember ? organizerMember._id : null;
      }
      return mId;
    }

    const resolvedPayers = [];
    if (Array.isArray(payers)) {
      for (const p of payers) {
        const mId = await resolveMemberId(p.memberId);
        resolvedPayers.push({
          type: p.type || 'MEMBER',
          memberId: mId,
          memberName: p.memberName || '',
          amount: Number(p.amount) || 0
        });
      }
    }

    const resolvedSplits = [];
    if (Array.isArray(splits)) {
      for (const s of splits) {
        const mId = await resolveMemberId(s.memberId);
        if (mId) {
          resolvedSplits.push({
            memberId: mId,
            memberName: s.memberName || '',
            shareAmount: Number(s.shareAmount) || 0
          });
        }
      }
    }

    const expense = new Expense({
      tripId: trip._id,
      title: title.trim(),
      amount: expAmount,
      category: category || 'Food',
      location: location || '',
      notes: notes || '',
      payerType: payerType || 'POOL',
      payers: resolvedPayers,
      splits: resolvedSplits
    });

    await expense.save();

    // 1. Update Trip Totals
    trip.totalTripSpent = (trip.totalTripSpent || 0) + expAmount;

    // 2. If paid by POOL or partial POOL
    if (payerType === 'POOL') {
      trip.totalPoolSpent = (trip.totalPoolSpent || 0) + expAmount;
    } else if (payerType === 'MULTI' && Array.isArray(resolvedPayers)) {
      for (const p of resolvedPayers) {
        if (p.type === 'POOL') {
          trip.totalPoolSpent = (trip.totalPoolSpent || 0) + (Number(p.amount) || 0);
        } else if (p.type === 'MEMBER' && p.memberId) {
          await Member.findByIdAndUpdate(p.memberId, {
            $inc: { directPaidOutOfPocket: Number(p.amount) || 0 }
          });
        }
      }
    } else if (payerType === 'MEMBER' && resolvedPayers?.[0]?.memberId) {
      await Member.findByIdAndUpdate(resolvedPayers[0].memberId, {
        $inc: { directPaidOutOfPocket: expAmount }
      });
    }

    await trip.save();

    // 3. Update splits for each member
    if (Array.isArray(resolvedSplits) && resolvedSplits.length > 0) {
      for (const s of resolvedSplits) {
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
