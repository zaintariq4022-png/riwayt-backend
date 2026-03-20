require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const testOrder = {
  orderNumber: 'RIW-00001',
  customer: {
    fullName: 'Test Customer',
    email: process.env.ADMIN_EMAIL,
    phone: '03001234567',
    address: 'Test Address',
    city: 'Lahore',
  },
  items: [{ name: 'Test Product', qty: 1, price: 3499, size: 'M' }],
  subtotal: 3499,
  deliveryFee: 250,
  total: 3749,
  paymentMethod: 'cod',
};

async function test() {
  try {
    // Customer email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: testOrder.customer.email,
      subject: `Test Order Confirmed — ${testOrder.orderNumber} | RIWAYAT`,
      html: `<h2>Order ${testOrder.orderNumber} confirmed!</h2><p>Customer: ${testOrder.customer.fullName}</p><p>Total: PKR ${testOrder.total}</p>`,
    });
    console.log('✅ Customer email sent to:', testOrder.customer.email);

    // Admin email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🛍 New Test Order — PKR ${testOrder.total}`,
      html: `<h2>New Order!</h2><p>Customer: ${testOrder.customer.fullName}</p><p>Phone: ${testOrder.customer.phone}</p><p>Total: PKR ${testOrder.total}</p>`,
    });
    console.log('✅ Admin email sent to:', process.env.ADMIN_EMAIL);

  } catch(e) {
    console.log('❌ Error:', e.message);
  }
}

test();
