require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Promo = require('../models/Promo');

const products = [
  {
    name: 'Gulbahar Embroidered Lawn Suit',
    description: 'A breathtaking 3-piece lawn suit with intricate floral embroidery on the front. Perfect for daytime events and casual gatherings. Features a beautifully crafted dupatta with matching borders.',
    price: 4850, originalPrice: 6500, discount: 25,
    category: 'women', subcategory: 'lawn-suits', fabric: 'Lawn',
    colors: ['Peach', 'Mint', 'Lilac'],
    sizes: [{ size: 'XS', stock: 10 }, { size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 12 }],
    emoji: '👗', bgColor: '#F5E6D3',
    badge: 'sale', tags: ['lawn', 'embroidered', 'summer', '3-piece'],
    isFeatured: true, images: [{ url: 'https://placehold.co/600x800/F5E6D3/1C1C1C?text=Gulbahar', alt: 'Gulbahar Lawn Suit' }],
  },
  {
    name: 'Shaan-e-Riwayat Silk Kurta',
    description: 'A masterpiece of traditional craftsmanship. This pure silk kurta features hand-done zari work and is perfect for weddings and formal events. Paired with organza dupatta.',
    price: 12500, originalPrice: 15000, discount: 17,
    category: 'women', subcategory: 'formal', fabric: 'Pure Silk',
    colors: ['Ivory', 'Champagne', 'Burgundy'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 12 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 6 }],
    emoji: '✨', bgColor: '#E8D5B0',
    badge: 'new', tags: ['silk', 'formal', 'wedding', 'zari'],
    isFeatured: true, images: [{ url: 'https://placehold.co/600x800/E8D5B0/1C1C1C?text=Silk+Kurta', alt: 'Silk Kurta' }],
  },
  {
    name: 'Baagh-e-Bahaar Printed Chiffon',
    description: 'Lightweight digital printed chiffon perfect for summer evenings. Features a graceful A-line silhouette with delicate lace detailing at the hem.',
    price: 3200, originalPrice: 4200, discount: 24,
    category: 'women', subcategory: 'chiffon', fabric: 'Chiffon',
    colors: ['Rose', 'Sky Blue', 'Sage Green'],
    sizes: [{ size: 'XS', stock: 5 }, { size: 'S', stock: 14 }, { size: 'M', stock: 18 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 8 }],
    emoji: '🌸', bgColor: '#EDD5D0',
    badge: 'hot', tags: ['chiffon', 'printed', 'summer', 'lightweight'],
    isFeatured: true, images: [{ url: 'https://placehold.co/600x800/EDD5D0/1C1C1C?text=Chiffon', alt: 'Chiffon Suit' }],
  },
  {
    name: 'Malika-e-Waqt Formal Pret',
    description: 'Regal full-length formal dress with intricate hand-embellished neckline. Crafted from premium velvet with a silk lining for ultimate comfort.',
    price: 18500,
    category: 'women', subcategory: 'formal', fabric: 'Velvet',
    colors: ['Deep Maroon', 'Forest Green', 'Navy'],
    sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 8 }, { size: 'L', stock: 7 }, { size: 'XL', stock: 4 }],
    emoji: '👑', bgColor: '#6B2737',
    badge: 'new', tags: ['velvet', 'formal', 'bridal', 'pret'],
    isFeatured: false, images: [{ url: 'https://placehold.co/600x800/6B2737/FAF7F2?text=Velvet+Formal', alt: 'Velvet Formal' }],
  },
  {
    name: 'Roshan Shalwar Kameez',
    description: 'A classic men\'s shalwar kameez crafted from premium cotton. Features subtle self-print fabric with contrasting embroidery on the neckline.',
    price: 3800, originalPrice: 4500, discount: 16,
    category: 'men', subcategory: 'shalwar-kameez', fabric: 'Cotton',
    colors: ['White', 'Off-White', 'Light Blue', 'Beige'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 14 }, { size: 'XXL', stock: 8 }],
    emoji: '👘', bgColor: '#D4E0E8',
    badge: 'sale', tags: ['cotton', 'men', 'classic', 'eid'],
    isFeatured: true, images: [{ url: 'https://placehold.co/600x800/D4E0E8/1C1C1C?text=Men+Kameez', alt: 'Men Kameez' }],
  },
  {
    name: 'Jashn Waistcoat Set',
    description: 'A premium waistcoat paired with matching kurta, crafted from fine cotton-silk blend. Ideal for festive occasions and Eid celebrations.',
    price: 6500,
    category: 'men', subcategory: 'waistcoat', fabric: 'Cotton-Silk',
    colors: ['Charcoal', 'Navy', 'Dark Green'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 12 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 6 }, { size: 'XXL', stock: 4 }],
    emoji: '🎩', bgColor: '#2C4A5A',
    badge: 'new', tags: ['waistcoat', 'festive', 'premium', 'men'],
    isFeatured: false, images: [{ url: 'https://placehold.co/600x800/2C4A5A/FAF7F2?text=Waistcoat', alt: 'Waistcoat Set' }],
  },
  {
    name: 'Mini Pari Frock',
    description: 'An adorable lawn frock for little girls with colourful embroidery and a full flared skirt. Comes with matching trousers and mini dupatta.',
    price: 1850, originalPrice: 2400, discount: 23,
    category: 'kids', subcategory: 'frocks', fabric: 'Lawn',
    colors: ['Pink', 'Yellow', 'Mint'],
    sizes: [{ size: '2-3Y', stock: 10 }, { size: '4-5Y', stock: 12 }, { size: '6-7Y', stock: 10 }, { size: '8-9Y', stock: 8 }],
    emoji: '🎀', bgColor: '#F0D5E8',
    badge: 'sale', tags: ['kids', 'girls', 'frock', 'lawn'],
    isFeatured: true, images: [{ url: 'https://placehold.co/600x800/F0D5E8/1C1C1C?text=Kids+Frock', alt: 'Kids Frock' }],
  },
  {
    name: 'Chirag Boys Shalwar Kameez',
    description: 'A stylish shalwar kameez for boys with machine embroidery on the neckline. Perfect for Eid and family gatherings.',
    price: 1650,
    category: 'kids', subcategory: 'shalwar-kameez', fabric: 'Cotton',
    colors: ['White', 'Beige', 'Light Green'],
    sizes: [{ size: '3-4Y', stock: 10 }, { size: '5-6Y', stock: 12 }, { size: '7-8Y', stock: 10 }, { size: '9-10Y', stock: 8 }],
    emoji: '👦', bgColor: '#D4E8D0',
    badge: '', tags: ['kids', 'boys', 'eid', 'cotton'],
    isFeatured: false, images: [{ url: 'https://placehold.co/600x800/D4E8D0/1C1C1C?text=Boys+Kameez', alt: 'Boys Kameez' }],
  },
];

const promos = [
  {
    code: 'RIWAYAT20',
    description: '20% off on all orders',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 2000,
    isActive: true,
  },
  {
    code: 'WELCOME500',
    description: 'PKR 500 off on first order',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 3000,
    isActive: true,
  },
  {
    code: 'EID2025',
    description: 'Eid special — 15% off',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 5000,
    isActive: true,
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing
    await Product.deleteMany();
    await Promo.deleteMany();
    await User.deleteMany({ role: { $ne: 'admin' } });

    // Seed products
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded`);

    // Seed promos
    await Promo.insertMany(promos);
    console.log(`✅ ${promos.length} promo codes seeded`);

    // Create admin if not exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await User.create({
        name: 'RIWAYAT Admin',
        email: process.env.ADMIN_EMAIL || 'admin@riwayat.pk',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
      });
      console.log('✅ Admin user created');
    }

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
