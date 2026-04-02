const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// POST /api/promo/validate — public (checkout pe use)
router.post('/validate', async (req, res) => {
  try {
    const { code, items, subtotal } = req.body;
    if (!code) return res.json({ success: false, message: 'Code daalen' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!promo) return res.json({ success: false, message: 'Invalid promo code' });

    // Expiry check
    if (promo.expiresAt && new Date() > promo.expiresAt)
      return res.json({ success: false, message: 'Promo code expire ho gaya' });

    // Max uses check
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
      return res.json({ success: false, message: 'Promo code ki limit khatam ho gayi' });

    // Min order check
    if (subtotal < promo.minOrderAmount)
      return res.json({ success: false, message: `Minimum order PKR ${promo.minOrderAmount.toLocaleString()} hona chahiye` });

    // Calculate discount on eligible items
    let eligibleAmount = subtotal;

    if (promo.scope === 'category' && items && promo.categories.length > 0) {
      const productIds = items.map(i => i.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      eligibleAmount = items.reduce((sum, item) => {
        const prod = products.find(p => p._id.toString() === item.productId);
        if (prod && promo.categories.includes(prod.category)) {
          return sum + (prod.price * item.qty);
        }
        return sum;
      }, 0);
    }

    if (promo.scope === 'product' && items && promo.products.length > 0) {
      const promoProductIds = promo.products.map(p => p.toString());
      const products = await Product.find({ _id: { $in: items.map(i => i.productId) } });
      eligibleAmount = items.reduce((sum, item) => {
        if (promoProductIds.includes(item.productId)) {
          const prod = products.find(p => p._id.toString() === item.productId);
          return sum + (prod ? prod.price * item.qty : 0);
        }
        return sum;
      }, 0);
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = Math.round(eligibleAmount * promo.value / 100);
    } else {
      discount = Math.min(promo.value, eligibleAmount);
    }

    res.json({
      success: true,
      discount,
      message: `✅ ${promo.type === 'percentage' ? promo.value + '% discount' : 'PKR ' + promo.value + ' off'} apply ho gaya!`,
      promo: { code: promo.code, type: promo.type, value: promo.value, scope: promo.scope }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/promo — admin: all promo codes
router.get('/', protect, async (req, res) => {
  const promos = await PromoCode.find().sort('-createdAt');
  res.json({ success: true, promos });
});

// POST /api/promo — admin: create
router.post('/', protect, async (req, res) => {
  try {
    const { code, type, value, scope, categories, products, minOrderAmount, maxUses, expiresAt } = req.body;
    const promo = await PromoCode.create({
      code: code.toUpperCase().trim(),
      type, value, scope,
      categories: categories || [],
      products: products || [],
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || 0,
      expiresAt: expiresAt || null,
    });
    res.json({ success: true, promo });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Yeh code pehle se exist karta hai' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/promo/:id — admin: update (toggle active etc)
router.put('/:id', protect, async (req, res) => {
  const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!promo) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, promo });
});

// DELETE /api/promo/:id — admin
router.delete('/:id', protect, async (req, res) => {
  await PromoCode.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
