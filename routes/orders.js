const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all order routes require login

router.post('/', ctrl.placeOrder);
router.post('/create-payment-intent', ctrl.createPaymentIntent);
router.post('/validate-promo', ctrl.validatePromo);
router.get('/my-orders', ctrl.getMyOrders);
router.get('/:id', ctrl.getOrder);

// Admin
router.get('/', authorize('admin'), ctrl.getAllOrders);
router.put('/:id/status', authorize('admin'), ctrl.updateOrderStatus);

module.exports = router;
