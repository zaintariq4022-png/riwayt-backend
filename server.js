require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
app.set('trust proxy', 1);

/* ─── Global Middleware ─── */
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'null'], // 'null' allows file:// for dev
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Rate Limiting ─── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

/* ─── Routes ─── */
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

/* ─── Health Check ─── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RIWAYAT API is running',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/* ─── Root Route ─── */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the RIWAYAT API. The server is running successfully!'
  });
});

/* ─── 404 handler ─── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* ─── Global Error Handler ─── */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 RIWAYAT Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;


