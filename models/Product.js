const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const sizeStockSchema = new mongoose.Schema({
  size:  { type: String, required: true }, // XS, S, M, L, XL, XXL
  stock: { type: Number, required: true, default: 0 },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Name cannot exceed 120 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: { type: Number }, // before discount
  discount: { type: Number, default: 0 }, // percentage

  category: {
    type: String,
    required: true,
    enum: ['women', 'men', 'kids', 'sale', 'new'],
  },
  subcategory: String, // e.g., kurtis, shalwar-kameez, etc.
  fabric: String,
  colors: [String],
  sizes: [sizeStockSchema],

  images: [
    {
      url:      { type: String, required: true },
      publicId: String, // for cloud storage
      alt:      String,
    },
  ],

  // Front-end display extras (matching existing HTML)
  emoji:     String,    // e.g. 👗
  bgColor:   String,    // CSS colour for card background

  tags:     [String],
  badge:    { type: String, enum: ['sale', 'new', 'hot', ''] },

  isFeatured: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },

  reviews:     [reviewSchema],
  numReviews:  { type: Number, default: 0 },
  avgRating:   { type: Number, default: 0 },

  soldCount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Date.now();
  }
  next();
});

// Recalculate average rating
productSchema.methods.calcAvgRating = function () {
  if (this.reviews.length === 0) {
    this.avgRating = 0;
    this.numReviews = 0;
  } else {
    this.avgRating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
