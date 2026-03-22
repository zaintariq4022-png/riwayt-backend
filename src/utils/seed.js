require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/riwayat');
  console.log('DB connected');
};

const products = [
  {
    name: 'Gulabi Unstitched Lawn 3-Piece',
    description: 'Premium lawn fabric with intricate floral embroidery, perfect for summer. Includes dupatta.',
    price: 3499, originalPrice: 4500,
    category: 'women', fabric: 'Lawn', subcategory: 'Summer Collection',
    sizes: ['Free Size'], emoji: '🌸', bgColor: '#FFE4E1',
    isFeatured: true, isNew: true, isSale: true, stock: 50,
    tags: ['lawn', 'summer', 'floral', 'unstitched'],
  },
  {
    name: 'Noor-e-Zara Embroidered Kurta',
    description: 'Ready-to-wear embroidered kurta with delicate threadwork on pure cotton.',
    price: 4200,
    category: 'new', fabric: 'Cotton', sizes: ['XS','S','M','L','XL'],
    emoji: '👗', bgColor: '#E8D5C4',
    isFeatured: true, isNew: true, stock: 35,
    tags: ['cotton', 'embroidered', 'pret', 'kurta'],
  },
  {
    name: 'Zevar-e-Ishq Bridal Lehenga',
    description: 'Handcrafted bridal lehenga with zardozi work, pure silk fabric and heavy dupatta.',
    price: 85000, originalPrice: 95000,
    category: 'bridal', fabric: 'Pure Silk', sizes: ['S','M','L','XL'],
    emoji: '👰', bgColor: '#FFF0E0',
    isFeatured: true, stock: 5,
    tags: ['bridal', 'silk', 'zardozi', 'wedding'],
  },
  {
    name: 'Bahar-e-Kashmir Pashmina Shawl',
    description: 'Authentic pashmina shawl from Kashmir with hand-woven patterns.',
    price: 12500,
    category: 'accessories', fabric: 'Pashmina',
    emoji: '🧣', bgColor: '#E8E4DF',
    isFeatured: false, isNew: true, stock: 20,
    tags: ['pashmina', 'shawl', 'accessories', 'winter'],
  },
  {
    name: 'Rang-e-Mehfil Chiffon Saree',
    description: 'Elegant chiffon saree with gold zari border, ideal for festive occasions.',
    price: 6800, originalPrice: 8000,
    category: 'stitching', fabric: 'Chiffon',
    emoji: '🌺', bgColor: '#FFEAEA',
    isFeatured: true, isSale: true, stock: 15,
    tags: ['chiffon', 'saree', 'festive', 'zari'],
  },
  {
    name: 'Miniature Mischief Kids Suit',
    description: 'Adorable embroidered kids suit, comfortable and durable for daily wear.',
    price: 1800, originalPrice: 2200,
    category: 'kids', fabric: 'Cotton', sizes: ['XS','S','M'],
    emoji: '🎀', bgColor: '#F0FFF4',
    isNew: true, isSale: true, stock: 40,
    tags: ['kids', 'embroidered', 'cotton'],
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear
    await Product.deleteMany();
    await Admin.deleteMany();

    // Insert products
    await Product.insertMany(products);
    console.log(`✅  ${products.length} products seeded`);

    // Create superadmin
    await Admin.create({
      name: 'RIWAYAT Admin',
      email: 'admin@riwayat.pk',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@1234',
      role: 'superadmin',
    });
    console.log('✅  Admin created: admin@riwayat.pk / Admin@1234');

    mongoose.disconnect();
    console.log('\n🎉  Seed complete!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
