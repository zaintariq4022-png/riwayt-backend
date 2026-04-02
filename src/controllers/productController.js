const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// FormData strings ko proper types mein convert karo
function sanitizeBody(body) {
  const bools = ['isFeatured','isNew','isSale','isHot','codEnabled'];
  const nums  = ['price','originalPrice','stock','advancePercent','rating','numReviews'];

  bools.forEach(k => {
    if (k in body) body[k] = body[k] === 'true' || body[k] === true;
  });
  nums.forEach(k => {
    if (k in body && body[k] !== '') body[k] = Number(body[k]);
  });

  // tags[] array
  if (body['tags[]']) {
    body.tags = Array.isArray(body['tags[]']) ? body['tags[]'] : [body['tags[]']];
    delete body['tags[]'];
  }
  // colors[] array
  if (body['colors[]']) {
    body.colors = Array.isArray(body['colors[]']) ? body['colors[]'] : [body['colors[]']];
    delete body['colors[]'];
  }
  // sizes[] array
  if (body['sizes[]']) {
    body.sizes = Array.isArray(body['sizes[]']) ? body['sizes[]'] : [body['sizes[]']];
    delete body['sizes[]'];
  }
  return body;
}

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
    const images = req.files ? req.files.map(f => f.path || f.secure_url || `/uploads/${f.filename}`) : [];
    const body   = sanitizeBody({ ...req.body });
    let sizeQtys = {};
    if (body.sizeQtys) { try { sizeQtys = JSON.parse(body.sizeQtys); } catch(e) {} }
    const totalStock = Object.values(sizeQtys).reduce((a, b) => a + Number(b), 0);
    const stock = totalStock > 0 ? totalStock : (Number(body.stock) || 0);
    const product = await Product.create({ ...body, images, sizeQtys, stock });
    res.status(201).json({ success:true, product });
  } catch(err) {
    console.error('createProduct error:', err.message);
    res.status(400).json({ success:false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });

    const body = sanitizeBody({ ...req.body });

    // New images append karo
    if (req.files && req.files.length > 0) {
      body.images = [...(product.images||[]), ...req.files.map(f => f.path || f.secure_url || `/uploads/${f.filename}`)];
    }

    // sizeQtys parse karo
    if (body.sizeQtys) {
      try {
        body.sizeQtys = JSON.parse(body.sizeQtys);
        const totalStock = Object.values(body.sizeQtys).reduce((a, b) => a + Number(b), 0);
        if (totalStock > 0) body.stock = totalStock;
      } catch(e) {}
    }

    Object.assign(product, body);
    await product.save();
    res.json({ success:true, product });
  } catch(err) {
    console.error('updateProduct error:', err.message);
    res.status(400).json({ success:false, message: err.message });
  }
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
