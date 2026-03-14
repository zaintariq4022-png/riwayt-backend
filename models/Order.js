const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true, min: 1 },
  size:     { type: String, required: true },
  image:    String,
  emoji:    String,
});

const shippingSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  phone:      { type: String, required: true },
  address:    { type: String, required: true },
  city:       { type: String, required: true },
  province:   { type: String, required: true },
  postalCode: String,
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },

  items:    [orderItemSchema],
  shipping: shippingSchema,

  // Pricing breakdown
  subtotal:      { type: Number, required: true },
  shippingCost:  { type: Number, default: 250 },
  discount:      { type: Number, default: 0 },
  promoCode:     String,
  total:         { type: Number, required: true },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['card', 'cod', 'easypaisa', 'jazzcash'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  stripePaymentIntentId: String,

  // Order lifecycle
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },

  trackingNumber: String,
  notes: String,

  statusHistory: [
    {
      status:    String,
      note:      String,
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  deliveredAt:  Date,
  cancelledAt:  Date,
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `RWY-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
