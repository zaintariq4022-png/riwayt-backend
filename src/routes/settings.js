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
