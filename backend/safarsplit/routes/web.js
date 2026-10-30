const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { renderTripView } = require('../views/tripView');
const { renderMemberView } = require('../views/memberView');
const { parseToken, createTripToken, createMemberToken } = require('../utils/cryptoHelper');

function getBaseUrl(req) {
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}`;
}

async function renderTripByCode(tripCode, req, res) {
  const code = (tripCode || '').trim().toUpperCase();
  const trip = await Trip.findOne({ tripCode: code });

  if (!trip) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Trip Not Found</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:50px 20px;background:#f8fafc;">
        <h2>🌴 Trip Not Found</h2>
        <p style="color:#64748b;">This trip does not exist or has expired.</p>
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
}

async function renderMemberById(tripCode, memberId, req, res) {
  const code = (tripCode || '').trim().toUpperCase();
  const trip = await Trip.findOne({ tripCode: code });
  if (!trip) return res.status(404).send('Trip not found');

  const member = await Member.findById(memberId);
  if (!member) return res.status(404).send('Member not found');

  const sharedExpenses = await Expense.find({
    tripId: trip._id,
    $or: [
      { 'splits.memberId': member._id },
      { 'payers.memberId': member._id }
    ]
  }).sort({ date: -1 });

  const payments = await Payment.find({
    tripId: trip._id,
    fromMemberId: member._id
  }).sort({ date: -1 });

  const baseUrl = getBaseUrl(req);
  const html = await renderMemberView(trip, member, sharedExpenses, payments, baseUrl);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

// 1. Primary Secure Encrypted Route (/s/:token and /share/:token)
router.get(['/s/:token', '/share/:token'], async (req, res) => {
  try {
    const token = req.params.token;
    const parsed = parseToken(token);

    if (!parsed) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🔒 Protected Link</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 60px 20px; background: #070F19; color: #f8fafc; }
            .card { max-width: 440px; margin: 0 auto; background: #111C2E; padding: 36px 24px; border-radius: 20px; border: 1px solid #1E293B; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .icon { font-size: 52px; margin-bottom: 16px; }
            h2 { font-size: 21px; font-weight: 800; margin-bottom: 10px; color: #F1F5F9; }
            p { font-size: 14px; color: #94A3B8; line-height: 1.6; }
            .badge { display: inline-block; margin-top: 20px; padding: 6px 14px; background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; font-size: 12px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🔒</div>
            <h2>Encrypted Access Only</h2>
            <p>This share link cannot be decrypted or has been altered. Ask the trip host to share a fresh encrypted link from the SafarSplit app.</p>
            <div class="badge">SafarSplit End-to-End Privacy</div>
          </div>
        </body>
        </html>
      `);
    }

    if (parsed.type === 'TRIP') {
      return await renderTripByCode(parsed.tripCode, req, res);
    } else if (parsed.type === 'MEMB') {
      return await renderMemberById(parsed.tripCode, parsed.memberId, req, res);
    }

    return res.status(400).send('Invalid token structure');
  } catch (err) {
    console.error('Error handling secure share link:', err);
    res.status(500).send('Error loading secure link');
  }
});

// 2. Backward Compatibility Route (/t/:tripCode or /t/:token)
// If an encrypted token is passed, it decodes and renders it directly.
// If a plain trip code is passed, it automatically upgrades & redirects to the encrypted /s/:token URL!
router.get(['/t/:tripCode', '/trip/:tripCode'], async (req, res) => {
  try {
    const rawParam = req.params.tripCode;
    const parsed = parseToken(rawParam);

    if (parsed) {
      if (parsed.type === 'TRIP') {
        return await renderTripByCode(parsed.tripCode, req, res);
      } else if (parsed.type === 'MEMB') {
        return await renderMemberById(parsed.tripCode, parsed.memberId, req, res);
      }
    }

    // Otherwise, it's a plain tripCode: upgrade to secure URL
    const tripCode = rawParam.trim().toUpperCase();
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

    // Redirect to encrypted secure token URL so plain ID is not retained in browser bar
    const secureToken = createTripToken(trip.tripCode);
    return res.redirect(`/s/${secureToken}`);
  } catch (err) {
    console.error('Error in /t/:tripCode handler:', err);
    res.status(500).send('Error processing request');
  }
});

// 3. Member Passbook Legacy Route: upgrades & redirects to encrypted /s/:token
router.get(['/t/:tripCode/m/:memberId', '/trip/:tripCode/member/:memberId'], async (req, res) => {
  try {
    const tripCode = req.params.tripCode.trim().toUpperCase();
    const memberId = req.params.memberId.trim();

    const trip = await Trip.findOne({ tripCode });
    if (!trip) return res.status(404).send('Trip not found');

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).send('Member not found');

    const secureToken = createMemberToken(trip.tripCode, member._id.toString());
    return res.redirect(`/s/${secureToken}`);
  } catch (err) {
    console.error('Error redirecting member route:', err);
    res.status(500).send('Error loading member view');
  }
});

module.exports = router;
