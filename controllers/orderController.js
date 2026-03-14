const Order = require('../models/Order');
const Product = require('../models/Product');
const Promo = require('../models/Promo');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/orders  — place order
exports.placeOrder = async (req, res, next) => {
  try {
    const { items, shipping, paymentMethod, promoCode, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Validate stock & calculate subtotal
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (sizeEntry && sizeEntry.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.size})`,
        });
      }
      subtotal += product.price * item.qty;
      enrichedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        size: item.size,
        emoji: product.emoji,
      });
    }

    // Shipping cost
    const shippingCost = subtotal >= 10000 ? 0 : 250;

    // Promo code discount
    let discount = 0;
    let validPromo = null;
    if (promoCode) {
      validPromo = await Promo.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (validPromo) {
        if (validPromo.expiresAt && validPromo.expiresAt < new Date()) {
          return res.status(400).json({ success: false, message: 'Promo code has expired' });
        }
        if (validPromo.minOrderValue && subtotal < validPromo.minOrderValue) {
          return res.status(400).json({
            success: false,
            message: `Minimum order value for this code is PKR ${validPromo.minOrderValue}`,
          });
        }
        discount = validPromo.discountType === 'percentage'
          ? Math.round(subtotal * validPromo.discountValue / 100)
          : validPromo.discountValue;
      }
    }

    const total = subtotal + shippingCost - discount;

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: enrichedItems,
      shipping,
      subtotal,
      shippingCost,
      discount,
      promoCode: validPromo ? validPromo.code : undefined,
      total,
      paymentMethod,
      notes,
      statusHistory: [{ status: 'placed', note: 'Order placed by customer' }],
    });

    // Decrement stock
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': -item.qty, soldCount: item.qty } }
      );
    }

    // Increment promo usage
    if (validPromo) {
      await Promo.findByIdAndUpdate(validPromo._id, { $inc: { usedCount: 1 } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/orders/create-payment-intent  — Stripe card payment
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount } = req.body; // amount in PKR (integer)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // stripe uses paisa / cents
      currency: 'pkr',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user.id },
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/orders/validate-promo
exports.validatePromo = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const promo = await Promo.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Invalid promo code' });
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Promo code has expired' });
    }
    if (promo.minOrderValue && subtotal < promo.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is PKR ${promo.minOrderValue}`,
      });
    }
    const discount = promo.discountType === 'percentage'
      ? Math.round(subtotal * promo.discountValue / 100)
      : promo.discountValue;
    res.json({ success: true, discount, promo: { code: promo.code, description: promo.description } });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders/my-orders  — customer's own orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .populate('items.product', 'name images slug');
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders/:id  — order detail (owner or admin)
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product user', 'name email images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/* ─── ADMIN ─── */

// @route   GET /api/orders  (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { orderStatus: status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name email');
    res.json({ success: true, total, orders });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/orders/:id/status  (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, note, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (orderStatus === 'delivered') order.deliveredAt = new Date();
    if (orderStatus === 'cancelled') order.cancelledAt = new Date();
    order.statusHistory.push({ status: orderStatus, note: note || '' });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
