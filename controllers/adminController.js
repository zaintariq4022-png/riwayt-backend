const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Promo = require('../models/Promo');

// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Totals
    const [totalOrders, totalUsers, totalProducts] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
    ]);

    // Revenue this month
    const revenueThisMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Revenue last month
    const revenueLastMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    // Revenue last 7 days (daily breakdown)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort('-soldCount')
      .limit(5)
      .select('name soldCount price category');

    // Recent orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber total orderStatus createdAt user');

    // Low stock products
    const lowStock = await Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$sizes' },
      { $match: { 'sizes.stock': { $lt: 5 } } },
      { $project: { name: 1, 'sizes.size': 1, 'sizes.stock': 1, category: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        totalProducts,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        revenueLastMonth: revenueLastMonth[0]?.total || 0,
      },
      ordersByStatus,
      dailyRevenue,
      topProducts,
      recentOrders,
      lowStock,
    });
  } catch (err) {
    next(err);
  }
};

/* ─── User Management ─── */
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');
    res.json({ success: true, total, users });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
};

/* ─── Promo Management ─── */
// @route   GET /api/admin/promos
exports.getPromos = async (req, res, next) => {
  try {
    const promos = await Promo.find().sort('-createdAt');
    res.json({ success: true, promos });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/admin/promos
exports.createPromo = async (req, res, next) => {
  try {
    const promo = await Promo.create(req.body);
    res.status(201).json({ success: true, promo });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/admin/promos/:id
exports.updatePromo = async (req, res, next) => {
  try {
    const promo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, promo });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/admin/promos/:id
exports.deletePromo = async (req, res, next) => {
  try {
    await Promo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Promo deleted' });
  } catch (err) {
    next(err);
  }
};
