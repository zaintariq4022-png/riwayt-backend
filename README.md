# RIWAYAT — Backend API & Admin Dashboard

> Node.js + Express + MongoDB backend for the RIWAYAT fashion e-commerce store.

---

## 📁 Project Structure

```
riwayat-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Admin login, password change
│   │   ├── productController.js   # CRUD for products
│   │   └── orderController.js     # Order placement & management
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   └── upload.js              # Multer image upload
│   ├── models/
│   │   ├── Admin.js               # Admin user model
│   │   ├── Product.js             # Product model
│   │   └── Order.js               # Order model
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── utils/
│   │   ├── email.js               # Nodemailer (order notifications)
│   │   └── seed.js                # Database seeder
│   └── server.js                  # Entry point
├── public/
│   └── admin/
│       └── index.html             # Admin Dashboard SPA
├── uploads/                       # Product images
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 2. Install dependencies
```bash
cd riwayat-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, email credentials, etc.
```

### 4. Seed the database
```bash
npm run seed
# Creates 6 sample products + admin user:
# Email: admin@riwayat.pk | Password: Admin@1234
```

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Server runs at: **http://localhost:5000**
Admin Dashboard: **http://localhost:5000/admin**

---

## 🔐 Admin Dashboard

Open `http://localhost:5000/admin` in your browser.

**Default credentials:**
| Field    | Value            |
|----------|------------------|
| Email    | admin@riwayat.pk |
| Password | Admin@1234       |

### Dashboard Features
- **Overview stats**: Revenue, Orders, Products, Deliveries
- **Revenue chart**: 7-day bar chart
- **Recent orders** quick view
- **Product management**: Add, edit, delete, filter by category, image upload
- **Order management**: View details, update status, tracking number, payment status
- **Email notifications**: Auto-sent on order placement and status updates
- **Demo mode**: Works without a backend (uses in-memory data)

---

## 📡 API Reference

### Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| POST   | `/admin/auth/login`             | Admin login         |
| GET    | `/admin/auth/me`                | Get current admin   |
| POST   | `/admin/auth/change-password`   | Change password     |

### Products (Public)
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/products`       | List products (filterable)|
| GET    | `/products/:id`   | Get single product       |

**Query params for GET /products:**
- `category` — filter by category
- `search` — text search
- `sort` — `newest`, `oldest`, `price_asc`, `price_desc`
- `featured=true` — featured only
- `sale=true` — sale items only
- `page`, `limit` — pagination

### Products (Admin — requires Bearer token)
| Method | Endpoint                      | Description        |
|--------|-------------------------------|--------------------|
| POST   | `/products`                   | Create product     |
| PUT    | `/products/:id`               | Update product     |
| DELETE | `/products/:id`               | Delete product     |
| DELETE | `/products/:id/image`         | Remove one image   |
| GET    | `/products/admin/stats`       | Product statistics |

### Orders (Public)
| Method | Endpoint                        | Description     |
|--------|---------------------------------|-----------------|
| POST   | `/orders`                       | Place new order |
| GET    | `/orders/track/:orderNumber`    | Track order     |

**POST /orders body:**
```json
{
  "customer": {
    "fullName": "Aisha Khan",
    "email": "aisha@example.com",
    "phone": "03001234567",
    "address": "12 Model Town",
    "city": "Lahore"
  },
  "items": [
    { "productId": "<id>", "qty": 2, "size": "M" }
  ],
  "paymentMethod": "cod",
  "promoCode": "RIWAYAT20"
}
```

### Orders (Admin — requires Bearer token)
| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/orders/admin`                 | List all orders      |
| GET    | `/orders/admin/:id`             | Get order details    |
| PUT    | `/orders/admin/:id/status`      | Update order status  |
| DELETE | `/orders/admin/:id`             | Delete order         |
| GET    | `/orders/admin/stats`           | Order statistics     |

**PUT /orders/admin/:id/status body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK123456",
  "paymentStatus": "paid"
}
```

---

## 📧 Email Notifications

Emails are sent automatically via Nodemailer:

1. **Customer order confirmation** — when a new order is placed
2. **Admin new order alert** — notifies admin on every new order
3. **Customer status update** — when order status changes (confirmed/shipped/delivered/cancelled)

Configure in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password   # Use Gmail App Password, not regular password
ADMIN_EMAIL=admin@riwayat.pk
```

---

## 🌐 Connecting to the Frontend

In your `index.html` frontend, replace the static `PRODUCTS` array with API calls:

```javascript
// Fetch products from API
const res = await fetch('http://localhost:5000/api/products?category=unstitched');
const { products } = await res.json();

// Place an order
const order = await fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: { fullName, email, phone, address, city },
    items: cart.map(item => ({ productId: item.id, qty: item.qty, size: item.size })),
    paymentMethod: 'cod',
  })
});
```

---

## 🗄️ MongoDB Schema Overview

### Product
```
name, slug, description, price, originalPrice,
category, subcategory, fabric, sizes[], colors[],
images[], emoji, bgColor, stock,
isFeatured, isNew, isSale, tags[],
rating, numReviews
```

### Order
```
orderNumber, customer{name,email,phone,address,city},
items[{product,name,price,size,qty}],
subtotal, deliveryFee, discount, total,
paymentMethod, paymentStatus,
status, trackingNumber, promoCode, emailSent
```

### Admin
```
name, email, password (hashed), role, isActive, lastLogin
```

---

## 🔒 Security Features
- JWT authentication with expiry
- Bcrypt password hashing (12 rounds)
- Rate limiting (200 req/15min global, 10 req/15min for login)
- Helmet.js security headers
- CORS whitelisting
- File type & size validation for uploads (5MB, JPEG/PNG/WebP only)

---

## 📦 Deployment (Production)

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for the database
3. Configure a production SMTP (e.g. SendGrid, Mailgun)
4. Deploy to Railway, Render, or a VPS
5. Point your frontend's API base URL to the deployed server

---

*Built for RIWAYAT — Timeless Pakistani Fashion* 🌸
