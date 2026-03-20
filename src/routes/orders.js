const express = require('express');
const router = express.Router();
const {
  placeOrder, trackOrder,
  getOrders, getOrder, updateOrderStatus, deleteOrder, getOrderStats,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Public
router.post('/', placeOrder);
router.get('/track/:orderNumber', trackOrder);

// Admin
router.use(protect);
router.get('/admin/stats', getOrderStats);
router.get('/admin', getOrders);
router.get('/admin/:id', getOrder);
router.put('/admin/:id/status', updateOrderStatus);
router.delete('/admin/:id', deleteOrder);

module.exports = router;
