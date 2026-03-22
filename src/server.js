require('dotenv').config();
require('express-async-errors');

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const connectDB       = require('./config/db');
const productRoutes   = require('./routes/Products');   // Capital P
const orderRoutes     = require('./routes/orders');
const authRoutes      = require('./routes/auth');
const customerRoutes  = require('./routes/customers');
const settingsRoutes  = require('./routes/settings');
const videoRoutes     = require('./routes/video');
const categoryRoutes  = require('./routes/categories');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin',   express.static(path.join(__dirname, '../public/admin')));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/video',      videoRoutes);
app.use('/api/categories', categoryRoutes);

// Pages
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/',      (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  RIWAYAT running on port ${PORT}`);
  console.log(`📊  Admin: http://localhost:${PORT}/admin\n`);
});
