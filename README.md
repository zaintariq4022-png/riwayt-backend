# 🛍️ RIWAYAT Backend API

A complete Node.js + Express + MongoDB backend for the **RIWAYAT** fashion e-commerce store.

---

## 📁 Project Structure

```
riwayat-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, profile, wishlist
│   ├── productController.js   # Product CRUD + reviews
│   ├── orderController.js     # Orders, payments, promo codes
│   └── adminController.js     # Dashboard, users, promos management
├── middleware/
│   ├── auth.js                # JWT protect + role authorize
│   └── errorHandler.js        # Global error handler
├── models/
│   ├── User.js                # User + addresses + wishlist
│   ├── Product.js             # Product + reviews + stock
│   ├── Order.js               # Orders + status history
│   └── Promo.js               # Promo / discount codes
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── admin.js
├── utils/
│   ├── seeder.js              # Seed DB with demo data
│   └── frontend-integration.js # Drop-in JS for your HTML
├── .env.example
├── package.json
└── server.js
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd riwayat-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Stripe keys
```

### 3. Seed the Database
```bash
npm run seed
```
This creates:
- 8 products (women, men, kids categories)
- 3 promo codes: `RIWAYAT20`, `WELCOME500`, `EID2025`
- Admin user (credentials from `.env`)

### 4. Start the Server
```bash
npm run dev        # Development (auto-restart)
npm start          # Production
```

Server runs at: `http://localhost:5000`

---

## 🔑 API Endpoints

### Auth `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, returns JWT token |
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/update-profile` | ✅ | Update name, phone |
| PUT | `/change-password` | ✅ | Change password |
| POST | `/address` | ✅ | Add delivery address |
| DELETE | `/address/:id` | ✅ | Remove address |
| POST | `/wishlist/:productId` | ✅ | Toggle wishlist item |

### Products `/api/products`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List products (filter, search, paginate) |
| GET | `/featured` | ❌ | Get featured products |
| GET | `/:id` | ❌ | Get single product by ID or slug |
| POST | `/:id/review` | ✅ | Add product review |
| POST | `/` | 🔐 Admin | Create product |
| PUT | `/:id` | 🔐 Admin | Update product |
| DELETE | `/:id` | 🔐 Admin | Soft-delete product |

**Query Params for GET /products:**
```
?category=women&search=lawn&sort=price-asc&minPrice=1000&maxPrice=10000&page=1&limit=12
```

### Orders `/api/orders`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Place new order |
| POST | `/create-payment-intent` | ✅ | Stripe payment intent |
| POST | `/validate-promo` | ✅ | Validate promo code |
| GET | `/my-orders` | ✅ | Customer's order history |
| GET | `/:id` | ✅ | Order detail |
| GET | `/` | 🔐 Admin | All orders |
| PUT | `/:id/status` | 🔐 Admin | Update order status |

### Admin `/api/admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats, revenue, charts data |
| GET | `/users` | All customers |
| PUT | `/users/:id/toggle` | Activate/deactivate user |
| GET | `/promos` | All promo codes |
| POST | `/promos` | Create promo code |
| PUT | `/promos/:id` | Update promo code |
| DELETE | `/promos/:id` | Delete promo code |

---

## 💳 Payment Integration

### Cash on Delivery (COD)
No extra setup needed. Set `paymentMethod: "cod"` in order payload.

### Stripe Card Payment
1. Add your Stripe secret key in `.env`
2. Install Stripe.js in your frontend: `<script src="https://js.stripe.com/v3/"></script>`
3. Call `POST /api/orders/create-payment-intent` to get a `clientSecret`
4. Use `stripe.confirmCardPayment(clientSecret, ...)` on the frontend
5. On success, call `POST /api/orders` with `paymentMethod: "card"`

---

## 🛒 Promo Codes (Pre-seeded)
| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| `RIWAYAT20` | Percentage | 20% off | PKR 2,000 |
| `WELCOME500` | Fixed | PKR 500 off | PKR 3,000 |
| `EID2025` | Percentage | 15% off | PKR 5,000 |

---

## 🔗 Connect Your Frontend

1. Copy `utils/frontend-integration.js` contents into your `index.html` `<script>` block
2. Change `const API = 'http://localhost:5000/api'` to your deployed URL
3. Replace the static `PRODUCTS` array with `renderProducts()` API calls
4. Update checkout `placeOrder()` to call `apiPlaceOrder()`

---

## 📊 Admin Dashboard Response

`GET /api/admin/dashboard` returns:
```json
{
  "stats": {
    "totalOrders": 142,
    "totalUsers": 89,
    "totalProducts": 36,
    "revenueThisMonth": 485000,
    "revenueLastMonth": 392000
  },
  "ordersByStatus": [...],
  "dailyRevenue": [...],
  "topProducts": [...],
  "recentOrders": [...],
  "lowStock": [...]
}
```

---

## 🚢 Deploy to Production

### Environment Variables to update:
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/riwayat
JWT_SECRET=<strong-random-secret>
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://yourdomain.com
```

### Recommended Hosting:
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: MongoDB Atlas (free tier works great)
- **Frontend**: Vercel, Netlify, or same server

---

## 🛡️ Security Features
- JWT authentication with configurable expiry
- bcrypt password hashing (12 rounds)
- Rate limiting (200 req/15min global, 20 req/15min for auth)
- Role-based access control (user / admin)
- Input validation via express-validator
- Soft deletes for products (data preserved)
- Stock validation before order placement
