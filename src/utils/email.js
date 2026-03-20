const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ─── helpers ──────────────────────────────────── */
const pkr = (n) => `PKR ${Number(n).toLocaleString('en-PK')}`;

const itemRows = (items) =>
  items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #EEE;">${i.name}${i.size ? ` — ${i.size}` : ''}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:center;">${i.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:right;">${pkr(i.price * i.qty)}</td>
      </tr>`
    )
    .join('');

/* ─── Customer Order Confirmation Email ─────────── */
const customerOrderHTML = (order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:0;}
    .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
    .header{background:#1C1C1C;padding:32px 40px;text-align:center;}
    .logo{color:#C9A84C;font-size:28px;letter-spacing:6px;text-transform:uppercase;}
    .body{padding:32px 40px;}
    h2{color:#1C1C1C;margin-top:0;}
    .badge{display:inline-block;background:#F5EFE6;color:#C9A84C;border:1px solid #C9A84C;padding:4px 14px;border-radius:30px;font-size:13px;font-weight:600;letter-spacing:1px;}
    table{width:100%;border-collapse:collapse;margin:20px 0;}
    th{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:left;padding-bottom:8px;border-bottom:2px solid #EEE;}
    .total-row td{font-weight:700;font-size:16px;padding-top:12px;}
    .info-box{background:#F9F6F2;border-radius:4px;padding:16px 20px;margin-top:20px;font-size:14px;color:#444;line-height:1.7;}
    .footer{background:#F5EFE6;padding:20px 40px;text-align:center;font-size:12px;color:#888;}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">RIWAYAT</div>
    <p style="color:#888;font-size:13px;margin:6px 0 0;">Luxury Pakistani Fashion</p>
  </div>
  <div class="body">
    <h2>Thank you, ${order.customer.fullName.split(' ')[0]}! 🎉</h2>
    <p style="color:#555;">Your order has been received and is being processed.</p>
    <div class="badge">Order ${order.orderNumber}</div>
    <table>
      <thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
      <tbody>${itemRows(order.items)}</tbody>
      <tfoot>
        <tr><td colspan="3" style="padding-top:8px;"></td></tr>
        <tr><td style="color:#555;">Subtotal</td><td></td><td style="text-align:right;">${pkr(order.subtotal)}</td></tr>
        <tr><td style="color:#555;">Delivery</td><td></td><td style="text-align:right;">${order.deliveryFee === 0 ? 'Free' : pkr(order.deliveryFee)}</td></tr>
        <tr class="total-row"><td>Total</td><td></td><td style="text-align:right;color:#C9A84C;">${pkr(order.total)}</td></tr>
      </tfoot>
    </table>
    <div class="info-box">
      <strong>Shipping to:</strong><br/>
      ${order.customer.fullName}<br/>
      ${order.customer.address}, ${order.customer.city}<br/>
      📞 ${order.customer.phone}
    </div>
    <p style="margin-top:24px;color:#555;">Payment: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
    <p style="color:#555;">Questions? WhatsApp: <strong>0348-5393402</strong></p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} RIWAYAT — Timeless Pakistani Elegance</div>
</div>
</body>
</html>`;

/* ─── Admin New Order Email ──────────────────────── */
const adminOrderHTML = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:0;}
  .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:6px;overflow:hidden;}
  .header{background:#C9A84C;padding:20px 30px;}
  .header h1{color:#fff;margin:0;font-size:20px;}
  .body{padding:24px 30px;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th{background:#f5f5f5;padding:8px;text-align:left;}
  td{padding:8px;border-bottom:1px solid #eee;}
  .alert{background:#FFF8E1;border-left:4px solid #C9A84C;padding:12px 16px;margin-bottom:16px;font-size:14px;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>🛍 New Order: ${order.orderNumber}</h1></div>
  <div class="body">
    <div class="alert"><strong>New order placed!</strong> ${new Date(order.createdAt).toLocaleString('en-PK')}</div>
    <h3>Customer Info</h3>
    <table>
      <tr><th>Name</th><td>${order.customer.fullName}</td></tr>
      <tr><th>Email</th><td>${order.customer.email}</td></tr>
      <tr><th>Phone</th><td>${order.customer.phone}</td></tr>
      <tr><th>City</th><td>${order.customer.city}</td></tr>
      <tr><th>Address</th><td>${order.customer.address}</td></tr>
      <tr><th>Payment</th><td>${order.paymentMethod.toUpperCase()}</td></tr>
    </table>
    <h3 style="margin-top:20px;">Items Ordered</h3>
    <table>
      <tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th></tr>
      ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.size || '—'}</td><td>${i.qty}</td><td>${pkr(i.price * i.qty)}</td></tr>`).join('')}
      <tr style="font-weight:bold;background:#f9f9f9;"><td colspan="3">Total</td><td>${pkr(order.total)}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#888;">Login to admin dashboard to process this order: <a href="http://localhost:5000/admin">localhost:5000/admin</a></p>
  </div>
</div>
</body>
</html>`;

/* ─── Admin New Customer Signup Email ───────────── */
const adminNewCustomerHTML = (customer) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:0;}
  .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:6px;overflow:hidden;}
  .header{background:#1C1C1C;padding:20px 30px;}
  .header h1{color:#C9A84C;margin:0;font-size:20px;letter-spacing:2px;}
  .body{padding:24px 30px;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th{background:#f5f5f5;padding:10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;}
  td{padding:10px;border-bottom:1px solid #eee;}
  .badge{display:inline-block;background:#E8F5E9;color:#2E7D32;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>👤 New Customer Registered</h1></div>
  <div class="body">
    <p style="color:#555;margin-bottom:16px;">A new customer has created an account on RIWAYAT.</p>
    <span class="badge">New Customer</span>
    <table style="margin-top:16px;">
      <tr><th>Full Name</th><td><strong>${customer.name}</strong></td></tr>
      <tr><th>Email</th><td>${customer.email}</td></tr>
      <tr><th>Phone</th><td>${customer.phone || '—'}</td></tr>
      <tr><th>City</th><td>${customer.city || '—'}</td></tr>
      <tr><th>Address</th><td>${customer.address || '—'}</td></tr>
      <tr><th>Joined</th><td>${new Date().toLocaleString('en-PK')}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#888;">View all customers in admin dashboard: <a href="http://localhost:5000/admin">localhost:5000/admin</a></p>
  </div>
</div>
</body>
</html>`;

/* ─── Exported functions ────────────────────────── */

// Order confirmation — customer + admin
exports.sendOrderConfirmation = async (order) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: order.customer.email,
      subject: `Order Confirmed — ${order.orderNumber} | RIWAYAT`,
      html: customerOrderHTML(order),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🛍 New Order ${order.orderNumber} — ${pkr(order.total)}`,
      html: adminOrderHTML(order),
    });

    return true;
  } catch (err) {
    console.error('📧  Email error:', err.message);
    return false;
  }
};

// New customer signup — notify admin
exports.sendNewCustomerNotification = async (customer) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `👤 New Customer: ${customer.name} | RIWAYAT`,
      html: adminNewCustomerHTML(customer),
    });
    return true;
  } catch (err) {
    console.error('📧  Customer notification error:', err.message);
    return false;
  }
};

// Order status update — notify customer
exports.sendOrderStatusUpdate = async (order) => {
  const statusMessages = {
    confirmed:   'Your order has been confirmed and will be processed shortly.',
    processing:  'Your order is being prepared for shipment.',
    shipped:     `Great news! Your order is on its way.${order.trackingNumber ? ` Tracking: <strong>${order.trackingNumber}</strong>` : ''}`,
    delivered:   'Your order has been delivered. We hope you love it! ❤️',
    cancelled:   'Your order has been cancelled. Contact us for assistance.',
  };

  const msg = statusMessages[order.status];
  if (!msg) return;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: order.customer.email,
      subject: `Order ${order.orderNumber} — ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | RIWAYAT`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:30px auto;border-radius:6px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
          <div style="background:#1C1C1C;padding:24px;text-align:center;">
            <div style="color:#C9A84C;font-size:24px;letter-spacing:6px;">RIWAYAT</div>
          </div>
          <div style="padding:28px;background:#fff;">
            <h2 style="margin-top:0;">Order Update — ${order.orderNumber}</h2>
            <p>${msg}</p>
            <p style="color:#888;font-size:13px;">Questions? WhatsApp 0348-5393402</p>
          </div>
        </div>`,
    });
  } catch (err) {
    console.error('📧  Status email error:', err.message);
  }
};
