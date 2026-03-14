const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getProducts);
router.get('/featured', ctrl.getFeatured);
router.get('/:id', ctrl.getProduct);
router.post('/:id/review', protect, ctrl.addReview);

// Admin only
router.post('/', protect, authorize('admin'), ctrl.createProduct);
router.put('/:id', protect, authorize('admin'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct);

module.exports = router;
