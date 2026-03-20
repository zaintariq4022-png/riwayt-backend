const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/admin/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (!admin.isActive) {
    return res.status(403).json({ success: false, message: 'Account is disabled' });
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken(admin._id);
  res.json({
    success: true,
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
};

// GET /api/admin/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// POST /api/admin/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+password');

  if (!(await admin.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }
  admin.password = newPassword;
  await admin.save();
  res.json({ success: true, message: 'Password changed successfully' });
};
