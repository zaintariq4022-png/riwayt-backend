const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

exports.protectCustomer = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Login karein' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.customer = await Customer.findById(decoded.id);
    if (!req.customer) {
      return res.status(401).json({ success: false, message: 'Customer not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
