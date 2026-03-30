const { Resend } = require('resend');
const Settings = require('../models/Settings');

const resend = new Resend(process.env.RESEND_API_KEY);

const pkr = (n) => `PKR ${Number(n).toLocaleString('en-PK')}`;

const itemRows = (items) =>
  items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;">${i.name}${i.size ? ` — ${i.size}` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:right;">${pkr(i.price * i.qty)}</td>
    </tr>`).join('');

// Get email template from DB or use default
async function getEmailTemplate(key, defaultHtml) {
  try {
    const setting = await Settings.findOne({ key });
    return (setting && setting.value && setting.value.html) ? setting.value.html : defaultHtml;
  } catch(e) {
    return defaultHtml;
  }
}

// Replace template variables
function renderTemplate(html, vars) {
  let result = html;
  Object.entries(vars).forEach(([k, v]) => {
    result = result.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
  });
  return result;
}

/* ─── Customer Order Confirmation ─────────────── */
const defaultCustomerOrderHTML = (order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Order Confirmed — ${order.orderNumber}</title>
</head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:#1C1C1C;padding:32px 40px;text-align:center;">
    <div style="color:#C9A84C;font-size:28px;letter-spacing:6px;font-weight:300;">RIWAYAT</div>
    <p style="color:#888;font-size:13px;margin:6px 0 0;">Luxury Pakistani Fashion</p>
  </div>
  <div style="padding:32px 40px;">
    <h2 style="color:#1C1C1C;margin-top:0;">Shukriya, ${order.customer.fullName.split(' ')[0]}! 🎉</h2>
    <p style="color:#555;">Aapka order receive ho gaya hai aur process ho raha hai.</p>
    <div style="display:inline-block;background:#F5EFE6;color:#C9A84C;border:1px solid #C9A84C;padding:4px 14px;border-radius:30px;font-size:13px;font-weight:600;letter-spacing:1px;">Order ${order.orderNumber}</div>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead><tr>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:left;padding-bottom:8px;border-bottom:2px solid #EEE;">Item</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:center;padding-bottom:8px;border-bottom:2px solid #EEE;">Qty</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:right;padding-bottom:8px;border-bottom:2px solid #EEE;">Price</th>
      </tr></thead>
      <tbody>${itemRows(order.items)}</tbody>
      <tfoot>
        <tr><td colspan="3" style="padding-top:8px;"></td></tr>
        <tr><td style="color:#555;padding:4px 0;">Subtotal</td><td></td><td style="text-align:right;padding:4px 0;">${pkr(order.subtotal)}</td></tr>
        <tr><td style="color:#555;padding:4px 0;">Delivery</td><td></td><td style="text-align:right;padding:4px 0;">${order.deliveryFee === 0 ? 'Free' : pkr(order.deliveryFee)}</td></tr>
        <tr><td style="font-weight:700;font-size:16px;padding-top:12px;">Total</td><td></td><td style="text-align:right;font-weight:700;font-size:16px;padding-top:12px;color:#C9A84C;">${pkr(order.total)}</td></tr>
      </tfoot>
    </table>
    <div style="background:#F9F6F2;border-radius:4px;padding:16px 20px;margin-top:20px;font-size:14px;color:#444;line-height:1.7;">
      <strong>Shipping Address:</strong><br/>
      ${order.customer.fullName}<br/>
      ${order.customer.address}, ${order.customer.city}<br/>
      📞 ${order.customer.phone}
    </div>
    <p style="margin-top:24px;color:#555;">Payment: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
    <p style="color:#555;">Koi sawal? WhatsApp karein: <strong>0348-5393402</strong></p>
  </div>
  <div style="background:#F5EFE6;padding:20px 40px;text-align:center;font-size:12px;color:#888;">
    © ${new Date().getFullYear()} RIWAYAT Fashion House — Made in Pakistan 🇵🇰<br/>
    <a href="https://riwayat-pakistan.online" style="color:#C9A84C;">riwayat-pakistan.online</a>
  </div>
</div>
</body>
</html>`;

/* ─── Admin New Order ──────────────────────────── */
const adminOrderHTML = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;">
  <div style="background:#C9A84C;padding:20px 30px;">
    <h1 style="color:#fff;margin:0;font-size:20px;">🛍 New Order: ${order.orderNumber}</h1>
  </div>
  <div style="padding:24px 30px;">
    <div style="background:#FFF8E1;border-left:4px solid #C9A84C;padding:12px 16px;margin-bottom:16px;font-size:14px;">
      <strong>New order placed!</strong> ${new Date(order.createdAt).toLocaleString('en-PK')}
    </div>
    <h3>Customer Info</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Name</th><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.fullName}</td></tr>
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Phone</th><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.phone}</td></tr>
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">City</th><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.city}</td></tr>
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Payment</th><td style="padding:8px;border-bottom:1px solid #eee;">${order.paymentMethod.toUpperCase()}</td></tr>
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Total</th><td style="padding:8px;font-weight:bold;color:#C9A84C;">${pkr(order.total)}</td></tr>
    </table>
    <h3 style="margin-top:20px;">Items</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Product</th><th style="background:#f5f5f5;padding:8px;">Size</th><th style="background:#f5f5f5;padding:8px;">Qty</th><th style="background:#f5f5f5;padding:8px;">Price</th></tr>
      ${order.items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.size||'—'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${pkr(i.price*i.qty)}</td></tr>`).join('')}
      <tr><td colspan="3" style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;font-weight:bold;color:#C9A84C;text-align:right;">${pkr(order.total)}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#888;">
      <a href="https://riwayat-pakistan.online/admin/" style="color:#C9A84C;">Admin Dashboard kholein</a>
    </p>
  </div>
</div>
</body>
</html>`;

/* ─── Exported functions ───────────────────────── */
exports.sendOrderConfirmation = async (order) => {
  try {
    // Get custom template if set
    const customHtml = await getEmailTemplate('email_order_template', null);
    let customerHtml;
    if (customHtml) {
      customerHtml = renderTemplate(customHtml, {
        customerName: order.customer.fullName.split(' ')[0],
        orderNumber: order.orderNumber,
        total: pkr(order.total),
        city: order.customer.city,
        phone: order.customer.phone,
        address: order.customer.address,
        paymentMethod: order.paymentMethod.toUpperCase(),
        items: itemRows(order.items),
      });
    } else {
      customerHtml = defaultCustomerOrderHTML(order);
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'orders@riwayat-pakistan.online',
      to: order.customer.email,
      subject: `✅ Order Confirmed — ${order.orderNumber} | RIWAYAT`,
      html: customerHtml,
      headers: {
        'X-Entity-Ref-ID': order.orderNumber,
        'List-Unsubscribe': '<mailto:unsubscribe@riwayat-pakistan.online>',
      },
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'orders@riwayat-pakistan.online',
      to: process.env.ADMIN_EMAIL,
      subject: `🛍 New Order ${order.orderNumber} — ${pkr(order.total)}`,
      html: adminOrderHTML(order),
    });

    return true;
  } catch(err) {
    console.error('📧 Email error:', err.message);
    return false;
  }
};

exports.sendNewCustomerNotification = async (customer) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'orders@riwayat-pakistan.online',
      to: process.env.ADMIN_EMAIL,
      subject: `👤 New Customer: ${customer.name} | RIWAYAT`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#fff;padding:24px;border-radius:6px;">
        <h2 style="color:#C9A84C;">New Customer Registered</h2>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone||'—'}</p>
        <p><strong>City:</strong> ${customer.city||'—'}</p>
      </div>`,
    });
    return true;
  } catch(err) {
    console.error('📧 Customer notification error:', err.message);
    return false;
  }
};

exports.sendOrderStatusUpdate = async (order) => {
  const statusMessages = {
    confirmed:  'Aapka order confirm ho gaya hai aur jald process hoga.',
    processing: 'Aapka order tayar kiya ja raha hai.',
    shipped:    `Khushkhabri! Aapka order rasta mein hai.${order.trackingNumber ? ` Tracking: <strong>${order.trackingNumber}</strong>` : ''}`,
    delivered:  'Aapka order deliver ho gaya. Umeed hai pasand aaya hoga! ❤️',
    cancelled:  'Aapka order cancel ho gaya. Madad ke liye humse rabta karein.',
  };

  const msg = statusMessages[order.status];
  if (!msg) return;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'orders@riwayat-pakistan.online',
      to: order.customer.email,
      subject: `Order ${order.orderNumber} — ${order.status.charAt(0).toUpperCase()+order.status.slice(1)} | RIWAYAT`,
      html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
        <div style="background:#1C1C1C;padding:24px;text-align:center;">
          <div style="color:#C9A84C;font-size:24px;letter-spacing:6px;">RIWAYAT</div>
        </div>
        <div style="padding:28px;">
          <h2 style="margin-top:0;color:#1C1C1C;">Order Update — ${order.orderNumber}</h2>
          <p style="color:#555;line-height:1.7;">${msg}</p>
          <p style="color:#888;font-size:13px;">Koi sawal? WhatsApp: <strong>0348-5393402</strong></p>
        </div>
        <div style="background:#F5EFE6;padding:16px;text-align:center;font-size:12px;color:#888;">
          © ${new Date().getFullYear()} RIWAYAT — <a href="https://riwayat-pakistan.online" style="color:#C9A84C;">riwayat-pakistan.online</a>
        </div>
      </div>
      </body>
      </html>`,
    });
  } catch(err) {
    console.error('📧 Status email error:', err.message);
  }
};
