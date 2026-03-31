const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// GET /api/settings/discount
router.get('/discount', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'global_discount' });
    res.json({ success: true, discount: setting ? setting.value : { active: false, percent: 0, label: '' } });
  } catch (err) {
    res.json({ success: true, discount: { active: false, percent: 0, label: '' } });
  }
});

// PUT /api/settings/discount
router.put('/discount', protect, async (req, res) => {
  const { active, percent, label } = req.body;
  if (percent < 0 || percent > 90) return res.status(400).json({ success: false, message: 'Discount 0 se 90% ke beech honi chahiye' });
  const setting = await Settings.findOneAndUpdate(
    { key: 'global_discount' },
    { key: 'global_discount', value: { active, percent: Number(percent), label: label || '' } },
    { upsert: true, new: true }
  );
  res.json({ success: true, discount: setting.value });
});

// GET /api/settings/hero_text — public
router.get('/hero_text', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'hero_text' });
    res.json({ success: true, value: setting ? setting.value : null });
  } catch (err) {
    res.json({ success: true, value: null });
  }
});

// PUT /api/settings/hero_text — admin only
router.put('/hero_text', protect, async (req, res) => {
  const { slides } = req.body;
  if (!slides || !Array.isArray(slides)) return res.status(400).json({ success: false, message: 'Invalid slides data' });
  await Settings.findOneAndUpdate(
    { key: 'hero_text' },
    { key: 'hero_text', value: slides },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Hero text updated!' });
});


// GET /api/settings/featured-products — public
router.get('/featured-products', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'featured_products' });
    res.json({ success: true, value: setting ? setting.value : [] });
  } catch (err) {
    res.json({ success: true, value: [] });
  }
});

// PUT /api/settings/featured-products — admin only
router.put('/featured-products', protect, async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds)) return res.status(400).json({ success: false, message: 'productIds array required' });
  await Settings.findOneAndUpdate(
    { key: 'featured_products' },
    { key: 'featured_products', value: productIds },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Featured products updated!' });
});


// GET /api/settings/featured-heading — public
router.get('/featured-heading', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'featured_heading' });
    res.json({ success: true, value: setting ? setting.value : null });
  } catch (err) {
    res.json({ success: true, value: null });
  }
});

// PUT /api/settings/featured-heading — admin only
router.put('/featured-heading', protect, async (req, res) => {
  const { label, labelColor, titleText, title, titleColor, emColor, font } = req.body;
  await Settings.findOneAndUpdate(
    { key: 'featured_heading' },
    { key: 'featured_heading', value: { label, labelColor, titleText, title, titleColor, emColor, font } },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Featured heading updated!' });
});


// GET /api/settings/category-discounts
router.get('/category-discounts', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'category_discounts' });
    res.json({ success: true, value: setting ? setting.value : {} });
  } catch(err) {
    res.json({ success: true, value: {} });
  }
});

// PUT /api/settings/category-discounts
router.put('/category-discounts', protect, async (req, res) => {
  const { discounts } = req.body;
  await Settings.findOneAndUpdate(
    { key: 'category_discounts' },
    { key: 'category_discounts', value: discounts },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Category discounts saved!' });
});


// GET /api/settings/email-template
router.get('/email-template', protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'email_order_template' });
    res.json({ success: true, value: setting ? setting.value : null });
  } catch(err) {
    res.json({ success: true, value: null });
  }
});

// PUT /api/settings/email-template
router.put('/email-template', protect, async (req, res) => {
  const { subject, html } = req.body;
  await Settings.findOneAndUpdate(
    { key: 'email_order_template' },
    { key: 'email_order_template', value: { subject, html } },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Email template saved!' });
});


// POST /api/settings/send-newsletter — admin only
router.post('/send-newsletter', protect, async (req, res) => {
  const { to, name, subject, heading, message, btnText } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:#1C1C1C;padding:28px;text-align:center;">
    <div style="color:#C9A84C;font-size:26px;letter-spacing:6px;font-weight:300;">RIWAYAT</div>
    <div style="color:#888;font-size:11px;margin-top:4px;">Luxury Pakistani Fashion</div>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1C1C1C;margin:0 0 16px;font-size:20px;">${heading}</h2>
    <div style="color:#555;font-size:14px;line-height:1.8;white-space:pre-line;">${message}</div>
    <div style="text-align:center;margin-top:28px;">
      <a href="https://riwayat-pakistan.online" style="display:inline-block;background:#C9A84C;color:#111;padding:12px 32px;border-radius:4px;font-weight:700;font-size:14px;text-decoration:none;">${btnText || 'Shop Now'}</a>
    </div>
  </div>
  <div style="background:#F5EFE6;padding:16px;text-align:center;font-size:11px;color:#888;">
    © ${new Date().getFullYear()} RIWAYAT Fashion House | <a href="https://riwayat-pakistan.online" style="color:#C9A84C;">riwayat-pakistan.online</a><br/>
    <span style="font-size:10px;">Unsubscribe: reply with "unsubscribe"</span>
  </div>
</div>
</body>
</html>`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'orders@riwayat-pakistan.online',
      to: to,
      subject: subject,
      html: html,
    });

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// GET /api/settings/social — public
router.get('/social', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'social_links' });
    res.json({ success: true, value: setting ? setting.value : null });
  } catch (err) {
    res.json({ success: true, value: null });
  }
});

// PUT /api/settings/social — admin only
router.put('/social', protect, async (req, res) => {
  const { social } = req.body;
  await Settings.findOneAndUpdate(
    { key: 'social_links' },
    { key: 'social_links', value: social },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'Social links updated!' });
});
