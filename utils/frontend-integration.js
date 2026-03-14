/**
 * ============================================================
 *  RIWAYAT FRONTEND ↔ BACKEND INTEGRATION GUIDE
 *  Drop this <script> block at the bottom of index.html
 *  (replace the current static PRODUCTS array and functions)
 * ============================================================
 */

/* ────────────────────────────────────────────
   1. CONFIG — change BASE_URL when you deploy
──────────────────────────────────────────── */
const API = 'http://localhost:5000/api';

// Persist JWT token
let authToken = localStorage.getItem('riwayat_token') || null;
let currentUser = JSON.parse(localStorage.getItem('riwayat_user') || 'null');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  ...extra,
});

/* ────────────────────────────────────────────
   2. AUTH HELPERS
──────────────────────────────────────────── */

/** Register a new user */
async function apiRegister(name, email, password, phone) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await res.json();
  if (data.success) {
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('riwayat_token', authToken);
    localStorage.setItem('riwayat_user', JSON.stringify(currentUser));
    showToast(`Welcome, ${currentUser.name}! 🎉`);
  }
  return data;
}

/** Log in */
async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) {
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('riwayat_token', authToken);
    localStorage.setItem('riwayat_user', JSON.stringify(currentUser));
    showToast(`Welcome back, ${currentUser.name}!`);
  }
  return data;
}

/** Log out */
function apiLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('riwayat_token');
  localStorage.removeItem('riwayat_user');
  showToast('You have been logged out.');
  showPage('home');
}

/* ────────────────────────────────────────────
   3. PRODUCTS — replace static renderProducts()
──────────────────────────────────────────── */

/**
 * Fetch products from API and render them.
 * @param {string} category  - 'all' | 'women' | 'men' | 'kids' | 'sale' | 'new'
 * @param {string} search    - search query string
 * @param {string} sort      - 'newest' | 'price-asc' | 'price-desc' | 'popular'
 */
async function renderProducts(category = 'all', search = '', sort = 'newest') {
  try {
    const params = new URLSearchParams({ sort, limit: 12 });
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    const res = await fetch(`${API}/products?${params}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const grid = document.getElementById('productGrid');
    grid.innerHTML = data.products.map(p => `
      <div class="product-card" onclick="openProduct('${p._id}')">
        <div class="product-img-wrap">
          ${p.badge ? `<span class="badge badge-${p.badge}">${p.badge}</span>` : ''}
          <button class="wishlist-btn" onclick="event.stopPropagation(); apiToggleWishlist('${p._id}', this)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <div class="prod-img-placeholder" style="background:${p.bgColor || '#F5EFE6'}">
            ${p.emoji || '👗'}
          </div>
          <button class="quick-add" onclick="event.stopPropagation(); quickAdd('${p._id}')">
            + Quick Add
          </button>
        </div>
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <div class="product-fabric">${p.fabric || ''}</div>
          <div class="product-price">
            <span class="price-current">PKR ${p.price.toLocaleString()}</span>
            ${p.originalPrice ? `<span class="price-original">PKR ${p.originalPrice.toLocaleString()}</span>` : ''}
            ${p.discount ? `<span class="price-save">${p.discount}% off</span>` : ''}
          </div>
          <div class="product-colors">
            ${(p.colors || []).slice(0, 4).map(c => `<span class="color-dot" title="${c}" style="background:${colorToHex(c)}"></span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Failed to load products:', err);
    showToast('Failed to load products. Please try again.');
  }
}

/* ────────────────────────────────────────────
   4. CART + CHECKOUT — API-powered order
──────────────────────────────────────────── */

/** Place order via API */
async function apiPlaceOrder(shippingInfo, paymentMethod, promoCode) {
  if (!authToken) {
    showToast('Please log in to place an order.');
    showPage('login'); // show your login page/modal
    return null;
  }

  const items = cart.map(item => ({
    product: item.id,      // product _id from API
    qty:     item.qty,
    size:    item.size,
  }));

  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ items, shipping: shippingInfo, paymentMethod, promoCode }),
  });
  const data = await res.json();

  if (data.success) {
    cart = [];
    updateCartBadge();
    showToast(`🎉 Order ${data.order.orderNumber} placed! Thank you for shopping with RIWAYAT`);
    setTimeout(() => showPage('home'), 1500);
  } else {
    showToast(data.message || 'Order failed. Please try again.');
  }
  return data;
}

/** Validate promo code via API */
async function apiValidatePromo(code, subtotal) {
  const res = await fetch(`${API}/orders/validate-promo`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ code, subtotal }),
  });
  return await res.json();
}

/** Stripe card payment flow */
async function apiCardPayment(amount) {
  const res = await fetch(`${API}/orders/create-payment-intent`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (data.success) {
    // Use Stripe.js: stripe.confirmCardPayment(data.clientSecret, { payment_method: { card: cardElement } })
    // See: https://stripe.com/docs/js/payment_intents/confirm_card_payment
    return data.clientSecret;
  }
  return null;
}

/** Toggle wishlist item */
async function apiToggleWishlist(productId, btn) {
  if (!authToken) { showToast('Please log in to use wishlist'); return; }
  const res = await fetch(`${API}/auth/wishlist/${productId}`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json();
  if (data.success) {
    btn.classList.toggle('wishlisted');
    const isWished = btn.classList.contains('wishlisted');
    showToast(isWished ? 'Added to wishlist ♥' : 'Removed from wishlist');
  }
}

/* ────────────────────────────────────────────
   5. UTILITY
──────────────────────────────────────────── */
function colorToHex(colorName) {
  const map = {
    'Peach': '#FFCBA4', 'Mint': '#98D8C8', 'Lilac': '#C8A8D8',
    'Ivory': '#FFFFF0', 'Champagne': '#F7E7CE', 'Burgundy': '#800020',
    'Rose': '#FF9999', 'Sky Blue': '#87CEEB', 'Sage Green': '#8FAF8F',
    'White': '#FFFFFF', 'Off-White': '#FAF9F6', 'Light Blue': '#ADD8E6',
    'Beige': '#F5F5DC', 'Charcoal': '#36454F', 'Navy': '#000080',
    'Dark Green': '#006400', 'Pink': '#FFB6C1', 'Yellow': '#FFFFE0',
    'Deep Maroon': '#6B2737', 'Forest Green': '#228B22',
  };
  return map[colorName] || '#CCC';
}
