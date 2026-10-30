const { createMemberToken } = require('../utils/cryptoHelper');

function getCategoryBadge(category) {
  const map = {
    Food: { emoji: '🍔', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    Snacks: { emoji: '🍟', bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    Travel: { emoji: '⛽', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    Stay: { emoji: '🏨', bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
    Sightseeing: { emoji: '🎟️', bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
    Shopping: { emoji: '🛍️', bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
    Emergency: { emoji: '💊', bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    Other: { emoji: '📌', bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
  };
  const item = map[category] || map.Other;
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;background:${item.bg};color:${item.text};border:1px solid ${item.border};font-size:12px;font-weight:600;">
    ${item.emoji} ${category}
  </span>`;
}

function renderTripView(trip, members, expenses, payments = [], baseUrl) {
  const currency = trip.currency || '₹';
  const inHandPool = Math.max(0, (trip.totalPoolCollected || 0) - (trip.totalPoolSpent || 0));

  const membersHtml = members.map(m => {
    const net = m.netBalance || 0;
    let badge = '';
    let badgeBg = '';
    let badgeText = '';

    if (Math.abs(net) < 1) {
      badge = 'All Settled ✅';
      badgeBg = '#ecfdf5';
      badgeText = '#047857';
    } else if (net < 0) {
      badge = `Owes ${currency}${Math.abs(Math.round(net))}`;
      badgeBg = '#fef2f2';
      badgeText = '#b91c1c';
    } else {
      badge = `+${currency}${Math.round(net)} in Pool`;
      badgeBg = '#eff6ff';
      badgeText = '#1d4ed8';
    }

    const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const memberTotalCredit = (m.poolContributed || 0) + (m.directPaidOutOfPocket || 0) + (m.settledAmount || 0);
    const memberTotalDebit = m.totalExpenseShare || 0;
    const secureMemberToken = createMemberToken(trip.tripCode, m._id.toString());

    return `
      <a href="${baseUrl}/s/${secureMemberToken}" style="text-decoration:none;color:inherit;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04);transition:transform 0.1s ease;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#0d9488;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">
              ${initials}
            </div>
            <div>
              <div style="font-weight:600;font-size:15px;color:#111827;">${m.name} ${m.isOrganizer ? '<span style="font-size:11px;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:6px;font-weight:500;">Host</span>' : ''}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">Given: ${currency}${Math.round(memberTotalCredit)} • Spent: ${currency}${Math.round(memberTotalDebit)}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <span style="display:inline-block;padding:4px 10px;border-radius:10px;font-size:12px;font-weight:700;background:${badgeBg};color:${badgeText};">
              ${badge}
            </span>
            <div style="font-size:11px;color:#0d9488;margin-top:4px;font-weight:500;">View Passbook →</div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  // Combine all activities: initial pool, expense contributions, expenses, and pool top-ups
  const activityList = [];

  // 1. Initial pool contributions from members
  members.forEach(m => {
    const pSum = payments.filter(p => p.fromMemberId?.toString() === m._id.toString()).reduce((acc, x) => acc + (x.amount || 0), 0);
    const initialDiff = (m.poolContributed || 0) - pSum;
    if (initialDiff > 0.5) {
      activityList.push({
        type: 'INITIAL_POOL',
        memberName: m.name,
        amount: initialDiff,
        date: new Date(trip.createdAt || Date.now())
      });
    }
  });

  // 2. Direct expense out-of-pocket payments (Credit) & expenses (Debit)
  expenses.forEach(e => {
    if (Array.isArray(e.payers)) {
      e.payers.forEach(p => {
        if (Number(p.amount) > 0 && p.type === 'MEMBER') {
          activityList.push({
            type: 'EXPENSE_PAID',
            expense: e,
            memberName: p.memberName || 'Friend',
            amount: Number(p.amount),
            date: new Date(new Date(e.date).getTime() - 1)
          });
        }
      });
    }
    activityList.push({
      type: 'EXPENSE',
      data: e,
      date: new Date(e.date)
    });
  });

  // 3. Pool top-ups & settlements
  payments.forEach(p => {
    activityList.push({
      type: 'PAYMENT',
      data: p,
      date: new Date(p.date)
    });
  });

  activityList.sort((a, b) => b.date - a.date);

  const activitiesHtml = activityList.length === 0 ? `
    <div style="text-align:center;padding:32px 16px;background:#ffffff;border-radius:16px;border:1px dashed #d1d5db;color:#6b7280;">
      <div style="font-size:32px;margin-bottom:8px;">🏖️</div>
      <div style="font-weight:600;">No activities recorded yet</div>
      <div style="font-size:13px;margin-top:4px;">When the host adds expenses or pool money, they will appear live here!</div>
    </div>
  ` : activityList.map(act => {
    const formattedDate = act.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (act.type === 'INITIAL_POOL') {
      return `
        <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:18px;">💰</div>
              <div>
                <div style="font-weight:700;font-size:15px;color:#065f46;">${act.memberName} gave Initial Pool Cash</div>
                <div style="font-size:12px;color:#6b7280;">Trip Inception • ${formattedDate}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800;font-size:17px;color:#059669;">+${currency}${act.amount}</div>
              <div style="font-size:11px;color:#059669;font-weight:600;">Contribution</div>
            </div>
          </div>
        </div>
      `;
    }

    if (act.type === 'EXPENSE_PAID') {
      return `
        <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div>
              <div>
                <div style="font-weight:700;font-size:15px;color:#065f46;">${act.memberName} contributed for ${act.expense.title}</div>
                <div style="font-size:12px;color:#6b7280;">${act.expense.category} • Direct Out of Pocket • ${formattedDate}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800;font-size:17px;color:#059669;">+${currency}${act.amount}</div>
              <div style="font-size:11px;color:#059669;font-weight:600;">Contribution</div>
            </div>
          </div>
        </div>
      `;
    }

    if (act.type === 'PAYMENT') {
      const p = act.data;
      return `
        <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:18px;">💰</div>
              <div>
                <div style="font-weight:700;font-size:15px;color:#065f46;">Pool Cash Added</div>
                <div style="font-size:12px;color:#6b7280;">${p.paymentMethod || 'Cash'} • ${formattedDate}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800;font-size:17px;color:#059669;">+${currency}${p.amount}</div>
              ${p.notes ? `<div style="font-size:11px;color:#4b5563;font-style:italic;">"${p.notes}"</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    const e = act.data;
    let payerLabel = 'Paid from Common Pool';
    if (e.payerType === 'ORGANIZER') payerLabel = 'Paid by Host';
    else if (e.payerType === 'MEMBER') payerLabel = `Paid by ${e.payers?.[0]?.memberName || 'Friend'}`;
    else if (e.payerType === 'MULTI') payerLabel = 'Paid by Multiple Members';

    const splitsSummary = e.splits && e.splits.length > 0 
      ? `Split among ${e.splits.length} friends (${e.splits.map(s => s.memberName).slice(0, 3).join(', ')}${e.splits.length > 3 ? '...' : ''})` 
      : '';

    return `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-weight:700;font-size:16px;color:#111827;">${e.title}</div>
            <div style="margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${getCategoryBadge(e.category)}
              ${e.location ? `<span style="font-size:12px;color:#4b5563;background:#f3f4f6;padding:2px 6px;border-radius:6px;">📍 ${e.location}</span>` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:17px;color:#0f766e;">${currency}${e.amount}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${formattedDate}</div>
          </div>
        </div>

        ${e.notes ? `<div style="font-size:13px;color:#4b5563;background:#f9fafb;padding:6px 10px;border-radius:8px;margin-top:8px;font-style:italic;">💬 "${e.notes}"</div>` : ''}

        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:12px;color:#6b7280;">
          <span>💳 <b>${payerLabel}</b></span>
          <span>👥 ${splitsSummary}</span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${trip.title} - Live Trip Monitor</title>
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
    .hero-banner {
      background: linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 22px 18px;
      box-shadow: 0 10px 25px -5px rgba(15, 118, 110, 0.25);
      position: relative;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .hero-banner::after {
      content: '🌴';
      position: absolute;
      right: 12px;
      bottom: -10px;
      font-size: 84px;
      opacity: 0.15;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 18px;
    }
    .metric-box {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      padding: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .pulse-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      margin-right: 6px;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .refresh-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #0f766e;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;color:#64748b;font-weight:600;display:flex;align-items:center;">
        <span class="pulse-dot"></span> LIVE TRIP MONITOR
      </div>
      <button class="refresh-btn" onclick="window.location.reload();">
        🔄 Refresh
      </button>
    </div>

    <div class="hero-banner">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.8;font-weight:700;">
        TRIP CODE: ${trip.tripCode}
      </div>
      <h1 style="font-size:24px;font-weight:800;margin-top:4px;">${trip.title}</h1>
      ${trip.destination ? `<div style="font-size:13px;opacity:0.9;margin-top:2px;">📍 ${trip.destination}</div>` : ''}

      <div class="metric-grid">
        <div class="metric-box">
          <div style="font-size:11px;opacity:0.8;font-weight:600;">💰 IN-HAND COMMON POOL</div>
          <div style="font-size:20px;font-weight:800;margin-top:2px;color:#a7f3d0;">${currency}${Math.round(inHandPool)}</div>
          <div style="font-size:10px;opacity:0.75;margin-top:2px;">of ${currency}${Math.round(trip.totalPoolCollected || 0)} collected</div>
        </div>
        <div class="metric-box">
          <div style="font-size:11px;opacity:0.8;font-weight:600;">📊 TOTAL TRIP COST</div>
          <div style="font-size:20px;font-weight:800;margin-top:2px;color:#fed7aa;">${currency}${Math.round(trip.totalTripSpent || 0)}</div>
          <div style="font-size:10px;opacity:0.75;margin-top:2px;">across ${activityList.length} activities</div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <span>👥 Friends Balance Board (${members.length})</span>
      <span style="font-size:12px;color:#64748b;font-weight:500;">Tap name to pay</span>
    </div>
    ${membersHtml}

    <div class="section-title">
      <span>📝 Live Activity Feed (${activityList.length})</span>
      <span style="font-size:12px;color:#64748b;font-weight:500;">Expenses & Pool Cash</span>
    </div>
    ${activitiesHtml}

    <footer style="text-align:center;margin-top:36px;padding:20px 16px;">
      <a href="https://priyan.online" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#64748b;text-decoration:none;font-weight:500;">
        © 2026 priyan. all rights reserved
      </a>
    </footer>
  </div>

  <script>
    setTimeout(() => { window.location.reload(); }, 30000);
  </script>
</body>
</html>`;
}

module.exports = { renderTripView };
