const QRCode = require('qrcode');
const { createTripToken } = require('../utils/cryptoHelper');

async function renderMemberView(trip, member, sharedExpenses, payments = [], baseUrl) {
  const currency = trip.currency || '₹';
  const net = member.netBalance || 0;
  const owesMoney = net < -0.5;
  const amountToPay = Math.abs(Math.round(net));

  const upiId = trip.organizerUpi || '';
  const organizerName = trip.organizerName || 'Trip Host';
  const upiNote = encodeURIComponent(`${trip.title} due from ${member.name}`);
  const upiUri = upiId 
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(organizerName)}&am=${amountToPay}&cu=INR&tn=${upiNote}`
    : '';

  let qrCodeDataUrl = '';
  if (owesMoney && upiUri) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(upiUri, { width: 220, margin: 1 });
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  }

  const totalCredit = (member.poolContributed || 0) + (member.directPaidOutOfPocket || 0) + (member.settledAmount || 0);
  const totalDebit = (member.totalExpenseShare || 0);

  // Combine shared expenses, direct payments, and payments for member passbook
  const passbookList = [];

  // 1. Initial pool contribution
  const paymentsSum = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const initialPoolDelta = (member.poolContributed || 0) - paymentsSum;
  if (initialPoolDelta > 0.5) {
    passbookList.push({
      type: 'INITIAL_POOL',
      amount: initialPoolDelta,
      date: new Date(trip.createdAt || Date.now()),
      order: 3
    });
  }

  sharedExpenses.forEach(e => {
    // 1. Bill Spent (Debit - First)
    const mySplit = e.splits?.find(s => s.memberId?.toString() === member._id.toString());
    if (mySplit && Number(mySplit.shareAmount) > 0) {
      passbookList.push({
        type: 'EXPENSE_SHARE',
        data: e,
        shareAmount: Number(mySplit.shareAmount),
        date: new Date(e.date),
        order: 0
      });
    }

    // 2. Pay for Bill (Credit - Follows right below bill)
    const myPayer = e.payers?.find(p => p.memberId?.toString() === member._id.toString());
    if (myPayer && Number(myPayer.amount) > 0) {
      passbookList.push({
        type: 'EXPENSE_PAID',
        data: e,
        paidAmount: Number(myPayer.amount),
        date: new Date(e.date),
        order: 1
      });
    }
  });

  payments.forEach(p => {
    passbookList.push({
      type: 'PAYMENT',
      data: p,
      date: new Date(p.date),
      order: 2
    });
  });

  passbookList.sort((a, b) => b.date - a.date || a.order - b.order);

  const itemsHtml = passbookList.length === 0 ? `
    <div style="text-align:center;padding:24px 16px;background:#ffffff;border-radius:14px;border:1px dashed #d1d5db;color:#6b7280;">
      No activity logs recorded yet for this member.
    </div>
  ` : passbookList.map(item => {
    const formattedDate = item.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });

    if (item.type === 'INITIAL_POOL') {
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#ffffff;border:1px solid #d1fae5;border-radius:12px;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:14px;color:#065f46;">💰 Initial Pool Contribution</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              Cash / Initial • ${formattedDate}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;font-size:15px;color:#059669;">+${currency}${item.amount}</div>
            <div style="font-size:11px;color:#059669;font-weight:600;">Credit</div>
          </div>
        </div>
      `;
    }

    if (item.type === 'EXPENSE_PAID') {
      const e = item.data;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#ffffff;border:1px solid #d1fae5;border-radius:12px;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:14px;color:#065f46;">💳 Paid for ${e.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${e.category} • Direct Out of Pocket • ${formattedDate}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;font-size:15px;color:#059669;">+${currency}${item.paidAmount}</div>
            <div style="font-size:11px;color:#059669;font-weight:600;">Credit</div>
          </div>
        </div>
      `;
    }

    if (item.type === 'PAYMENT') {
      const p = item.data;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#ffffff;border:1px solid #d1fae5;border-radius:12px;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:14px;color:#065f46;">💰 Pool Contribution (${p.paymentMethod || 'Cash'})</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${formattedDate} ${p.notes ? `• "${p.notes}"` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;font-size:15px;color:#059669;">+${currency}${p.amount}</div>
            <div style="font-size:11px;color:#059669;font-weight:600;">Credit</div>
          </div>
        </div>
      `;
    }

    const e = item.data;
    const mySplit = e.splits?.find(s => s.memberId?.toString() === member._id.toString());
    const myShare = mySplit ? mySplit.shareAmount : 0;

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:8px;">
        <div>
          <div style="font-weight:600;font-size:14px;color:#111827;">${e.title}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">
            ${e.category} ${e.location ? `• 📍 ${e.location}` : ''} • ${formattedDate}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;font-size:15px;color:#b91c1c;">-${currency}${Math.round(myShare)}</div>
          <div style="font-size:11px;color:#9ca3af;">Total: ${currency}${e.amount}</div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${member.name}'s Passbook - ${trip.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding-bottom: 40px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 16px;
    }
    .back-nav {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #0f766e;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 14px;
    }
    .passbook-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 20px 18px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      margin-bottom: 16px;
    }
    .status-banner-red {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      margin-top: 14px;
    }
    .status-banner-green {
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      margin-top: 14px;
    }
    .upi-btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      text-align: center;
      text-decoration: none;
      padding: 14px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);
      margin-top: 14px;
      transition: transform 0.1s ease;
    }
    .upi-btn:active {
      transform: scale(0.98);
    }
    .metrics-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 14px;
    }
    .metric-pill {
      background: #f1f5f9;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }
    .qr-container {
      margin-top: 14px;
      text-align: center;
      background: #ffffff;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="${baseUrl}/s/${createTripToken(trip.tripCode)}" class="back-nav">
      ← Back to ${trip.title}
    </a>

    <div class="passbook-card">
      <div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
        MEMBER PASSBOOK
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin-top:4px;">
        ${member.name}
      </h1>
      <div style="font-size:13px;color:#64748b;margin-top:2px;">
        Trip: <b>${trip.title}</b> (${trip.tripCode})
      </div>

      <div class="metrics-row">
        <div class="metric-pill">
          <div style="font-size:11px;color:#64748b;font-weight:600;">💰 TOTAL GIVEN (CREDIT)</div>
          <div style="font-size:17px;font-weight:800;color:#0f766e;margin-top:2px;">
            +${currency}${Math.round(totalCredit)}
          </div>
        </div>
        <div class="metric-pill">
          <div style="font-size:11px;color:#64748b;font-weight:600;">🍔 TOTAL SPENT (DEBIT)</div>
          <div style="font-size:17px;font-weight:800;color:#b91c1c;margin-top:2px;">
            -${currency}${Math.round(totalDebit)}
          </div>
        </div>
      </div>

      ${owesMoney ? `
        <div class="status-banner-red">
          <div style="font-size:12px;color:#991b1b;font-weight:700;text-transform:uppercase;">
            NET PENDING TO PAY
          </div>
          <div style="font-size:32px;font-weight:800;color:#dc2626;margin:4px 0;">
            ${currency}${amountToPay}
          </div>
          <div style="font-size:12px;color:#7f1d1d;">
            Pay to: <b>${organizerName}</b> (${upiId || 'UPI'})
          </div>

          ${upiUri ? `
            <a href="${upiUri}" class="upi-btn">
              ⚡ Pay ${currency}${amountToPay} via UPI
            </a>
            <div style="font-size:11px;color:#64748b;margin-top:6px;">
              Opens Google Pay, PhonePe, Paytm or BHIM
            </div>

            ${qrCodeDataUrl ? `
              <div class="qr-container">
                <div style="font-size:12px;color:#475569;font-weight:600;margin-bottom:6px;">
                  Or scan with any UPI App:
                </div>
                <img src="${qrCodeDataUrl}" alt="UPI QR Code" style="display:inline-block;border-radius:8px;">
                <div style="font-size:11px;color:#64748b;margin-top:4px;">UPI ID: <b>${upiId}</b></div>
              </div>
            ` : ''}
          ` : `
            <div style="font-size:12px;color:#64748b;margin-top:8px;">
              Contact host directly to settle dues.
            </div>
          `}
        </div>
      ` : `
        <div class="status-banner-green">
          <div style="font-size:12px;color:#047857;font-weight:700;text-transform:uppercase;">
            ${Math.abs(net) < 1 ? 'ALL SETTLED ✅' : 'SURPLUS CREDIT IN POOL 🎉'}
          </div>
          <div style="font-size:30px;font-weight:800;color:#059669;margin:4px 0;">
            ${currency}${Math.round(Math.max(0, net))}
          </div>
          <div style="font-size:12px;color:#065f46;">
            ${Math.abs(net) < 1 
              ? 'You have zero pending dues for this trip.' 
              : 'You contributed more than your share! You will get this back at the end of the trip.'}
          </div>
        </div>
      `}
    </div>

    <div style="font-size:15px;font-weight:700;color:#1e293b;margin:18px 0 10px 0;">
      🧾 Passbook Activity History (${passbookList.length})
    </div>
    ${itemsHtml}

    <footer style="text-align:center;margin-top:32px;padding:20px 14px;">
      <a href="https://priyan.online" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#64748b;text-decoration:none;font-weight:500;">
        © 2026 priyan. all rights reserved
      </a>
    </footer>
  </div>
</body>
</html>`;
}

module.exports = { renderMemberView };
