const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, required: true }, // % ya fixed PKR
  scope: { type: String, enum: ['all', 'category', 'product'], default: 'all' },
  categories: [{ type: String }], // jab scope=category
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // jab scope=product
  minOrderAmount: { type: Number, default: 0 },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
