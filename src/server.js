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
const sitemapRoutes   = require('./routes/sitemap');
const promoRoutes     = require('./routes/promoCodes');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── Dynamic OG tags for product sharing ──────────────────
// MUST be BEFORE static files!
const Product = require('./models/Product');

app.get('/product/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.redirect('/');

    const title   = `${product.name} — RIWAYAT`;
    const desc    = product.description ? product.description.substring(0, 150) : 'Luxury Pakistani Fashion';
    const image   = product.images && product.images[0] ? product.images[0] : 'https://riwayat-pakistan.online/og-image.jpg';
    const url     = `https://riwayat-pakistan.online/product/${product.slug}`;
    const price   = `PKR ${product.price.toLocaleString()}`;

    // Agar bot hai toh OG HTML do, warna frontend pe redirect karo
    const ua = req.headers['user-agent'] || '';
    const isBot = /whatsapp|facebookexternalhit|twitterbot|googlebot|linkedinbot|slackbot|telegrambot|discordbot|crawler|spider|bot|preview/i.test(ua);
    // WhatsApp ke liye hamesha OG serve karo
    const forceOG = req.query.og === '1';

    if (isBot || forceOG) {
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <meta property="og:type" content="product"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${desc} — ${price}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:width" content="800"/>
  <meta property="og:image:height" content="1067"/>
  <meta property="og:site_name" content="RIWAYAT"/>
  <meta property="product:price:amount" content="${product.price}"/>
  <meta property="product:price:currency" content="PKR"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image" content="${image}"/>
</head>
<body><script>window.location='/#detail?id=${product._id}'</script></body>
</html>`);
    }

    // Normal user — frontend pe redirect with product ID
    return res.redirect(`/#detail?pid=${product._id}`);
  } catch(e) {
    return res.redirect('/');
  }
});

// Short share link: /p/PRODUCT_ID — works for all users + bots
app.get('/p/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/');

    const title = `${product.name} — RIWAYAT`;
    const desc  = (product.description || 'Luxury Pakistani Fashion').substring(0, 150);
    const image = product.images?.[0] || 'https://riwayat-pakistan.online/og-image.jpg';
    const url   = `https://riwayat-pakistan.online/p/${product._id}`;

    const ua    = req.headers['user-agent'] || '';
    const isBot = /whatsapp|facebook|twitter|telegram|discord|linkedin|slack|google|bot|crawler|spider|preview/i.test(ua);

    if (isBot) {
      return res.send(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <meta property="og:type" content="product"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${desc} — PKR ${product.price.toLocaleString()}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:secure_url" content="${image}"/>
  <meta property="og:image:type" content="image/jpeg"/>
  <meta property="og:image:width" content="800"/>
  <meta property="og:image:height" content="1067"/>
  <meta property="og:site_name" content="RIWAYAT — Pakistan Fashion"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:image" content="${image}"/>
</head>
<body><p>${title}</p></body>
</html>`);
    }

    // Normal user — index.html serve karo with auto-open script
    const fs = require('fs');
    const indexPath = require('path').join(__dirname, '../public/index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    const autoOpen = `<script>
      window.__openProductId = '${product._id}';
      // Try immediately and also on productsLoaded event
      function _tryOpenProduct() {
        var pid = window.__openProductId;
        if (!pid) return;
        if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0) {
          var p = PRODUCTS.find(function(pr){ return pr.id === pid; });
          if (p && typeof showProductDetail === 'function') {
            window.__openProductId = null;
            showProductDetail(p.id);
            return;
          }
        }
        // Retry
        setTimeout(_tryOpenProduct, 300);
      }
      // Start trying after page loads
      if (document.readyState === 'complete') {
        setTimeout(_tryOpenProduct, 500);
      } else {
        window.addEventListener('load', function(){ setTimeout(_tryOpenProduct, 500); });
      }
      window.addEventListener('productsLoaded', _tryOpenProduct);
    </script>`;
    html = html.replace('</body>', autoOpen + '</body>');
    return res.send(html);
  } catch(e) {
    return res.redirect('/');
  }
});
// Static files — AFTER product route
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin',   express.static(path.join(__dirname, '../public/admin')));
app.use(express.static(path.join(__dirname, '../public')));

// ─────────────────────────────────────────────────────────

// API Routes
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/video',      videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promo',      promoRoutes);

// Sitemap & robots
app.use('/sitemap.xml', sitemapRoutes);
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://riwayat-pakistan.online/sitemap.xml');
});

// Pages
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/admin/bill', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/bill.html')));
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
