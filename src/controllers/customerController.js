const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { sendNewCustomerNotification } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/customers/signup
exports.signup = async (req, res) => {
  const { name, email, password, phone, city, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email aur password zaroori hain' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password kam az kam 6 characters ka hona chahiye' });
  }

  const existing = await Customer.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Yeh email pehle se registered hai' });
  }

  const customer = await Customer.create({ name, email, password, phone, city, address });

  // Notify admin about new customer signup
  await sendNewCustomerNotification(customer);

  const token = signToken(customer._id);
  res.status(201).json({
    success: true,
    token,
    customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address },
  });
};

// POST /api/customers/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email aur password likhein' });
  }

  const customer = await Customer.findOne({ email }).select('+password');
  if (!customer || !(await customer.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
  }

  customer.lastLogin = new Date();
  await customer.save({ validateBeforeSave: false });

  const token = signToken(customer._id);
  res.json({
    success: true,
    token,
    customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address },
  });
};

// GET /api/customers/me
exports.getMe = async (req, res) => {
  res.json({ success: true, customer: req.customer });
};

// PUT /api/customers/profile
exports.updateProfile = async (req, res) => {
  const { name, phone, city, address } = req.body;
  const customer = await Customer.findById(req.customer._id);

  if (name) customer.name = name;
  if (phone) customer.phone = phone;
  if (city) customer.city = city;
  if (address) customer.address = address;

  await customer.save();
  res.json({
    success: true,
    customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address },
  });
};

// PUT /api/customers/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const customer = await Customer.findById(req.customer._id).select('+password');

  if (!(await customer.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Purana password galat hai' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Naya password kam az kam 6 characters ka hona chahiye' });
  }

  customer.password = newPassword;
  await customer.save();
  res.json({ success: true, message: 'Password successfully change ho gaya' });
};

// GET /api/customers/orders
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ 'customer.email': req.customer.email })
    .sort('-createdAt')
    .limit(20);
  res.json({ success: true, orders });
};
