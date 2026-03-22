require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const productRoutes = require('./routes/products');
const orderRoutes  = require('./routes/orders');
const authRoutes   = require('./routes/auth');

// ─── Connect Database ──────────────────────────────
connectDB();

const app = express();

// ─── Security & Middleware ─────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in production or specific ones
    const allowed = [
      'http://localhost:5000',
      'http://localhost:3000',
      'https://www.riwayat-pakistan.online',
      'https://riwayat-pakistan.online',
    ];
    if (!origin || allowed.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' }));
app.use('/api/admin/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));

// ─── Static Files ──────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// ─── API Routes ────────────────────────────────────
app.use('/api/products',          productRoutes);
app.use('/api/orders',            orderRoutes);
app.use('/api/admin/auth',        authRoutes);

// ─── Admin Dashboard SPA ──────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// ─── Health Check ─────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── 404 ──────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  RIWAYAT Backend running on http://localhost:${PORT}`);
  console.log(`📊  Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🌿  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
