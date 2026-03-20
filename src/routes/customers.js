const express = require('express');
const router = express.Router();
const {
  signup, login, getMe, updateProfile, changePassword, getMyOrders,
} = require('../controllers/customerController');
const { protectCustomer } = require('../middleware/customerAuth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protectCustomer, getMe);
router.put('/profile', protectCustomer, updateProfile);
router.put('/change-password', protectCustomer, changePassword);
router.get('/orders', protectCustomer, getMyOrders);

module.exports = router;
