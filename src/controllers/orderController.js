const Order = require('../models/Order');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/email');

/* ─── Public ──────────────────────────────────── */

// POST /api/orders  — Place a new order
exports.placeOrder = async (req, res) => {
  const { customer, items, paymentMethod, promoCode, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  // Validate products & build order items
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
    }
    if (product.stock < item.qty) {
      return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
    }
    orderItems.push({
      product: product._id,
      _product: product, // temp ref for promo scope check
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      size: item.size || '',
      qty: item.qty,
    });
    subtotal += product.price * item.qty;
  }

  const deliveryFee = subtotal >= 10000 ? 0 : 250;
  let discount = 0;
  let appliedPromo = null;

  if (promoCode) {
    const promo = await PromoCode.findOne({ code: promoCode.toUpperCase().trim(), active: true });
    if (promo && !(promo.expiresAt && new Date() > promo.expiresAt) && !(promo.maxUses > 0 && promo.usedCount >= promo.maxUses) && subtotal >= promo.minOrderAmount) {
      let eligibleAmount = subtotal;
      if (promo.scope === 'category' && promo.categories.length > 0) {
        eligibleAmount = orderItems.reduce((sum, item) => {
          const prod = item._product;
          return prod && promo.categories.includes(prod.category) ? sum + (item.price * item.qty) : sum;
        }, 0);
      } else if (promo.scope === 'product' && promo.products.length > 0) {
        const promoIds = promo.products.map(p => p.toString());
        eligibleAmount = orderItems.reduce((sum, item) => promoIds.includes(item.product.toString()) ? sum + (item.price * item.qty) : sum, 0);
      }
      discount = promo.type === 'percentage' ? Math.round(eligibleAmount * promo.value / 100) : Math.min(promo.value, eligibleAmount);
      appliedPromo = promo;
    }
  }

  const total = subtotal + deliveryFee - discount;

  // Remove temp _product refs before saving
  const cleanItems = orderItems.map(({ _product, ...rest }) => rest);

  const order = await Order.create({
    customer,
    items: cleanItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    paymentMethod: paymentMethod || 'cod',
    promoCode: promoCode || '',
    notes: notes || '',
  });

  // Reduce stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
  }

  // Increment promo usedCount
  if (appliedPromo) {
    await PromoCode.findByIdAndUpdate(appliedPromo._id, { $inc: { usedCount: 1 } });
  }

  // Send response immediately, email in background
  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    order: { orderNumber: order.orderNumber, total: order.total, status: order.status },
  });

  // Send email in background (non-blocking)
  sendOrderConfirmation(order).then(sent => {
    if (sent) Order.findByIdAndUpdate(order._id, { emailSent: true }).catch(() => {});
  }).catch(() => {});
};

// GET /api/orders/:orderNumber  — Track order by number
exports.trackOrder = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate(
    'items.product',
    'name images'
  );
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
    },
  });
};

/* ─── Admin ───────────────────────────────────── */

// GET /api/admin/orders
exports.getOrders = async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const query = {};

  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customer.fullName': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), orders });
};

// GET /api/admin/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images category');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

// PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { status, trackingNumber, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (status) order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();

  // Notify customer
  if (status) await sendOrderStatusUpdate(order);

  res.json({ success: true, order });
};

// DELETE /api/admin/orders/:id
exports.deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, message: 'Order deleted' });
};

// GET /api/admin/orders/stats
exports.getOrderStats = async (req, res) => {
  const [total, pending, processing, shipped, delivered, cancelled, revenue] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'processing' }),
    Order.countDocuments({ status: 'shipped' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  // Last 7 days revenue
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    total,
    byStatus: { pending, processing, shipped, delivered, cancelled },
    totalRevenue: revenue[0]?.total || 0,
    dailyRevenue,
  });
};
