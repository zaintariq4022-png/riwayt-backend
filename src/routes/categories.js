const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

const DEFAULT_CATEGORIES = [
  { id: 'women',      label: 'Women',            emoji: '👗', active: true,  discount: 0 },
  { id: 'kids',       label: 'Kids',             emoji: '🎀', active: true,  discount: 0 },
  { id: 'sale',       label: 'Sale',             emoji: '🏷️', active: true,  discount: 0 },
  { id: 'new',        label: 'New Arrivals',     emoji: '✨', active: true,  discount: 0 },
  { id: 'stitching',  label: 'Stitching Details',emoji: '🧵', active: true,  discount: 0 },
  { id: 'fancy',      label: 'Fancy',            emoji: '💎', active: true,  discount: 0 },
  { id: 'bridal',     label: 'Bridal',           emoji: '👰', active: true,  discount: 0 },
  { id: 'accessories',label: 'Accessories',      emoji: '🧣', active: true,  discount: 0 },
];

// GET /api/categories — public
router.get('/', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'categories' });
    res.json({ success: true, categories: setting ? setting.value : DEFAULT_CATEGORIES });
  } catch (err) {
    res.json({ success: true, categories: DEFAULT_CATEGORIES });
  }
});

// PUT /api/categories — admin
router.put('/', protect, async (req, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ success: false, message: 'Invalid categories data' });
  }
  await Settings.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', value: categories },
    { upsert: true, new: true }
  );
  res.json({ success: true, categories });
});

module.exports = router;
