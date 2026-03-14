const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true },
  description: String,
  discountType:  { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxUses:       { type: Number, default: null }, // null = unlimited
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     Date,
}, { timestamps: true });

module.exports = mongoose.model('Promo', promoSchema);
