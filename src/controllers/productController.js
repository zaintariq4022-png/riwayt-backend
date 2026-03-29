const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

exports.getProducts = async (req, res) => {
  const { category, search, sort, page = 1, limit = 20 } = req.query;
  const query = {};
  if (category && category !== 'all') query.category = category;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { tags: { $in: [new RegExp(search, 'i')] } },
  ];
  const sortMap = { newest:'-createdAt', price_asc:'price', price_desc:'-price' };
  const skip = (Number(page)-1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortMap[sort]||'-createdAt').skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  res.json({ success:true, total, page:Number(page), pages:Math.ceil(total/Number(limit)), products });
};

exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success:false, message:'Product not found' });
  res.json({ success:true, product });
};

exports.createProduct = async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => f.path || `/uploads/${f.filename}`) : [];
    let sizeQtys = {};
    if (req.body.sizeQtys) { try { sizeQtys = JSON.parse(req.body.sizeQtys); } catch(e) {} }
    const totalStock = Object.values(sizeQtys).reduce((a, b) => a + Number(b), 0);
    const stock = totalStock > 0 ? totalStock : (Number(req.body.stock) || 0);
    const product = await Product.create({ ...req.body, images, sizeQtys, stock });
    res.status(201).json({ success:true, product });
  } catch(err) { res.status(400).json({ success:false, message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });
    if (req.files && req.files.length > 0) {
      req.body.images = [...(product.images||[]), ...req.files.map(f => f.path || `/uploads/${f.filename}`)];
    }
    if (req.body.sizeQtys) {
      try {
        req.body.sizeQtys = JSON.parse(req.body.sizeQtys);
        const totalStock = Object.values(req.body.sizeQtys).reduce((a, b) => a + Number(b), 0);
        if (totalStock > 0) req.body.stock = totalStock;
      } catch(e) {}
    }
    // Handle sizes array
    if (req.body['sizes[]']) {
      req.body.sizes = Array.isArray(req.body['sizes[]']) ? req.body['sizes[]'] : [req.body['sizes[]']];
      delete req.body['sizes[]'];
    }
    Object.assign(product, req.body);
    await product.save();
    res.json({ success:true, product });
  } catch(err) { res.status(400).json({ success:false, message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success:false, message:'Product not found' });
  product.images.forEach(img => {
    const fp = path.join(__dirname, '../../', img);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  });
  await product.deleteOne();
  res.json({ success:true, message:'Product deleted' });
};

exports.deleteProductImage = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success:false, message:'Product not found' });
  const { imageUrl } = req.body;
  product.images = product.images.filter(img => img !== imageUrl);
  await product.save();
  res.json({ success:true, images:product.images });
};

exports.getProductStats = async (req, res) => {
  const [total, outOfStock, onSale, featured] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ stock:0 }),
    Product.countDocuments({ isSale:true }),
    Product.countDocuments({ isFeatured:true }),
  ]);
  res.json({ success:true, total, outOfStock, onSale, featured });
};