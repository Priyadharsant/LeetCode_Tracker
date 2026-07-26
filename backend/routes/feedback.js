const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { type, message, email } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_USER || 'contact@priyan.online',
      to: process.env.MAIL_TO || 'priyadharsant4@gmail.com',
      subject: `[DSA Tracker Feedback] ${type}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-w-lg mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div style="background-color: #38CCB1; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Feedback Received</h2>
          </div>
          <div style="padding: 32px; background-color: #f9fafb;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 100px;"><strong>Type</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 15px; font-weight: 500;">${type}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;"><strong>Email</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 15px;">
                  ${email ? `<a href="mailto:${email}" style="color: #38CCB1; text-decoration: none;">${email}</a>` : '<em>Not provided</em>'}
                </td>
              </tr>
            </table>
            
            <h3 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0;">Message Content</h3>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; color: #1f2937; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>
          <div style="padding: 16px; text-align: center; background-color: #f3f4f6; color: #9ca3af; font-size: 12px;">
            Sent automatically from your DSA Tracker App
          </div>
        </div>
      `,
      reply_to: email || undefined
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(500).json({ error: 'Failed to send feedback' });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server Error (Feedback Route):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
