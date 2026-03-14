const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin')); // all admin routes

router.get('/dashboard', ctrl.getDashboard);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/toggle', ctrl.toggleUserStatus);
router.get('/promos', ctrl.getPromos);
router.post('/promos', ctrl.createPromo);
router.put('/promos/:id', ctrl.updatePromo);
router.delete('/promos/:id', ctrl.deletePromo);

module.exports = router;
