// routes/auth.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.put('/update-profile', protect, ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);
router.post('/address', protect, ctrl.addAddress);
router.delete('/address/:addrId', protect, ctrl.removeAddress);
router.post('/wishlist/:productId', protect, ctrl.toggleWishlist);

module.exports = router;
