const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { renderTripView } = require('../views/tripView');
const { renderMemberView } = require('../views/memberView');

function getBaseUrl(req) {
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}`;
}

// 1. Live Trip Monitor Page
router.get(['/t/:tripCode', '/trip/:tripCode'], async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });

    if (!trip) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Trip Not Found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px 20px;background:#f8fafc;">
          <h2>🌴 Trip Not Found</h2>
          <p style="color:#64748b;">The trip code <b>${tripCode}</b> does not exist or has expired.</p>
        </body>
        </html>
      `);
    }

    const members = await Member.find({ tripId: trip._id });
    const expenses = await Expense.find({ tripId: trip._id }).sort({ date: -1 });
    const payments = await Payment.find({ tripId: trip._id }).sort({ date: -1 });

    const baseUrl = getBaseUrl(req);
    const html = renderTripView(trip, members, expenses, payments, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error rendering trip view:', err);
    res.status(500).send('Error loading trip view');
  }
});

// 2. Individual Member Passbook & UPI Settle Page
router.get(['/t/:tripCode/m/:memberId', '/trip/:tripCode/member/:memberId'], async (req, res) => {
  try {
    const tripCode = req.params.tripCode.toUpperCase();
    const trip = await Trip.findOne({ tripCode });

    if (!trip) return res.status(404).send('Trip not found');

    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).send('Member not found');

    const sharedExpenses = await Expense.find({
      tripId: trip._id,
      'splits.memberId': member._id
    }).sort({ date: -1 });

    const payments = await Payment.find({
      tripId: trip._id,
      fromMemberId: member._id
    }).sort({ date: -1 });

    const baseUrl = getBaseUrl(req);
    const html = await renderMemberView(trip, member, sharedExpenses, payments, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error rendering member view:', err);
    res.status(500).send('Error loading member view');
  }
});

module.exports = router;
