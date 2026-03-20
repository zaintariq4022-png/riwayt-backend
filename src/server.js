require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const productRoutes    = require('./routes/Products');
const orderRoutes      = require('./routes/orders');
const authRoutes       = require('./routes/auth');
const customerRoutes   = require('./routes/customers');
const settingsRoutes   = require('./routes/settings');
const videoRoutes      = require('./routes/video');
const categoryRoutes   = require('./routes/categories');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/admin/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/customers/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/products',    productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/admin/auth',  authRoutes);
app.use('/api/customers',   customerRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/video',       videoRoutes);
app.use('/api/categories',  categoryRoutes);
const sitemapRoute = require('./routes/sitemap');
app.use('/sitemap.xml', sitemapRoute);
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  RIWAYAT Backend running on http://localhost:${PORT}`);
  console.log(`📊  Admin Dashboard: http://localhost:${PORT}/admin\n`);
});
