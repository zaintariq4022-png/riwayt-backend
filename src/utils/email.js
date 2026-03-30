const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const pkr = (n) => `PKR ${Number(n).toLocaleString('en-PK')}`;

const itemRows = (items) =>
  items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;">${i.name}${i.size ? ` — ${i.size}` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:right;">${pkr(i.price * i.qty)}</td>
    </tr>`).join('');

async function getEmailTemplate(key) {
  try {
    const setting = await Settings.findOne({ key });
    return (setting && setting.value && setting.value.html) ? setting.value : null;
  } catch(e) { return null; }
}

function renderTemplate(html, vars) {
  let result = html;
  Object.entries(vars).forEach(([k, v]) => {
    result = result.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
  });
  return result;
}

const defaultCustomerOrderHTML = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:#1C1C1C;padding:32px 40px;text-align:center;">
    <div style="color:#C9A84C;font-size:28px;letter-spacing:6px;font-weight:300;">RIWAYAT</div>
    <p style="color:#888;font-size:13px;margin:6px 0 0;">Luxury Pakistani Fashion</p>
  </div>
  <div style="padding:32px 40px;">
    <h2 style="color:#1C1C1C;margin-top:0;">Shukriya, ${order.customer.fullName.split(' ')[0]}! 🎉</h2>
    <p style="color:#555;">Aapka order receive ho gaya hai aur process ho raha hai.</p>
    <div style="display:inline-block;background:#F5EFE6;color:#C9A84C;border:1px solid #C9A84C;padding:4px 14px;border-radius:30px;font-size:13px;font-weight:600;">Order ${order.orderNumber}</div>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead><tr>
        <th style="font-size:11px;text-transform:uppercase;color:#888;text-align:left;padding-bottom:8px;border-bottom:2px solid #EEE;">Item</th>
        <th style="font-size:11px;text-transform:uppercase;color:#888;text-align:center;padding-bottom:8px;border-bottom:2px solid #EEE;">Qty</th>
        <th style="font-size:11px;text-transform:uppercase;color:#888;text-align:right;padding-bottom:8px;border-bottom:2px solid #EEE;">Price</th>
      </tr></thead>
      <tbody>${itemRows(order.items)}</tbody>
      <tfoot>
        <tr><td colspan="3" style="padding-top:8px;"></td></tr>
        <tr><td style="color:#555;padding:4px 0;">Subtotal</td><td></td><td style="text-align:right;padding:4px 0;">${pkr(order.subtotal)}</td></tr>
        <tr><td style="color:#555;padding:4px 0;">Delivery</td><td></td><td style="text-align:right;padding:4px 0;">${order.deliveryFee===0?'Free':pkr(order.deliveryFee)}</td></tr>
        <tr><td style="font-weight:700;font-size:16px;padding-top:12px;">Total</td><td></td><td style="text-align:right;font-weight:700;font-size:16px;padding-top:12px;color:#C9A84C;">${pkr(order.total)}</td></tr>
      </tfoot>
    </table>
    <div style="background:#F9F6F2;border-radius:4px;padding:16px 20px;margin-top:20px;font-size:14px;color:#444;line-height:1.7;">
      <strong>Delivery Address:</strong><br/>
      ${order.customer.fullName}<br/>
      ${order.customer.address}, ${order.customer.city}<br/>
      📞 ${order.customer.phone}
    </div>
    <p style="margin-top:24px;color:#555;">Payment: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
    <p style="color:#555;">Koi sawal? WhatsApp: <strong>0348-5393402</strong></p>
  </div>
  <div style="background:#F5EFE6;padding:20px 40px;text-align:center;font-size:12px;color:#888;">
    © ${new Date().getFullYear()} RIWAYAT Fashion House — Made in Pakistan 🇵🇰<br/>
    <a href="https://riwayat-pakistan.online" style="color:#C9A84C;">riwayat-pakistan.online</a>
  </div>
</div>
</body>
</html>`;

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
      <strong>New order!</strong> ${new Date(order.createdAt).toLocaleString('en-PK')}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:600;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.fullName}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:600;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.phone}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:600;">City</td><td style="padding:8px;border-bottom:1px solid #eee;">${order.customer.city}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:600;">Payment</td><td style="padding:8px;border-bottom:1px solid #eee;">${order.paymentMethod.toUpperCase()}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:600;">Total</td><td style="padding:8px;font-weight:bold;color:#C9A84C;">${pkr(order.total)}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">Product</th><th style="background:#f5f5f5;padding:8px;">Size</th><th style="background:#f5f5f5;padding:8px;">Qty</th><th style="background:#f5f5f5;padding:8px;text-align:right;">Price</th></tr>
      ${order.items.map(i=>`<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.size||'—'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${pkr(i.price*i.qty)}</td></tr>`).join('')}
      <tr><td colspan="3" style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;font-weight:bold;color:#C9A84C;text-align:right;">${pkr(order.total)}</td></tr>
    </table>
    <p style="margin-top:16px;"><a href="https://riwayat-pakistan.online/admin/" style="color:#C9A84C;">Admin Dashboard</a></p>
  </div>
</div>
</body>
</html>`;

exports.sendOrderConfirmation = async (order) => {
  try {
    const template = await getEmailTemplate('email_order_template');
    let customerHtml;
    if (template && template.html) {
      customerHtml = renderTemplate(template.html, {
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

    const fromName = 'RIWAYAT Fashion';
    const fromEmail = process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: order.customer.email,
      replyTo: fromEmail,
      subject: `✅ Order Confirmed — ${order.orderNumber} | RIWAYAT`,
      html: customerHtml,
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
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
    await transporter.sendMail({
      from: `"RIWAYAT Fashion" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `👤 New Customer: ${customer.name} | RIWAYAT`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:24px;border-radius:6px;background:#fff;">
        <h2 style="color:#C9A84C;">New Customer</h2>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone||'—'}</p>
        <p><strong>City:</strong> ${customer.city||'—'}</p>
      </div>`,
    });
    return true;
  } catch(err) {
    console.error('📧 Error:', err.message);
    return false;
  }
};

exports.sendOrderStatusUpdate = async (order) => {
  const msgs = {
    confirmed:  'Aapka order confirm ho gaya hai.',
    processing: 'Aapka order tayar kiya ja raha hai.',
    shipped:    `Aapka order rasta mein hai!${order.trackingNumber?` Tracking: <strong>${order.trackingNumber}</strong>`:''}`,
    delivered:  'Aapka order deliver ho gaya. Shukriya! ❤️',
    cancelled:  'Aapka order cancel ho gaya. Rabta karein.',
  };
  const msg = msgs[order.status];
  if (!msg) return;
  try {
    await transporter.sendMail({
      from: `"RIWAYAT Fashion" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject: `Order ${order.orderNumber} Update | RIWAYAT`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
        <div style="background:#1C1C1C;padding:24px;text-align:center;">
          <div style="color:#C9A84C;font-size:24px;letter-spacing:6px;">RIWAYAT</div>
        </div>
        <div style="padding:28px;">
          <h2 style="margin-top:0;">Order Update — ${order.orderNumber}</h2>
          <p style="color:#555;">${msg}</p>
          <p style="color:#888;font-size:13px;">WhatsApp: <strong>0348-5393402</strong></p>
        </div>
        <div style="background:#F5EFE6;padding:16px;text-align:center;font-size:12px;color:#888;">
          © ${new Date().getFullYear()} RIWAYAT — <a href="https://riwayat-pakistan.online" style="color:#C9A84C;">riwayat-pakistan.online</a>
        </div>
      </div>`,
    });
  } catch(err) {
    console.error('📧 Status email error:', err.message);
  }
};
