const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct,
  createProduct, updateProduct, deleteProduct,
  deleteProductImage, getProductStats,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/', getProducts);
router.get('/admin/stats', protect, getProductStats);
router.get('/:id', getProduct);

// Admin
router.post('/', protect, upload, createProduct);
router.put('/:id', protect, upload, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.delete('/:id/image', protect, deleteProductImage);

module.exports = router;