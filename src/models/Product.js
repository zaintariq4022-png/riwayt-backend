const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null },
    category: {
      type: String,
      required: true,
      enum: ['women', 'kids', 'sale', 'new', 'stitching', 'fancy', 'bridal', 'accessories'],
    },
    subcategory: { type: String, default: '' },
    fabric: { type: String, default: '' },
    shortDesc: { type: String, default: '' },
    fabricCare: { type: String, default: '' },
    sizes: [{ type: String }],
    sizeQtys: { type: Map, of: Number, default: {} },
    colors: [{ type: String }],
    images: [{ type: String }],           // URLs (Cloudinary or local path)
    videoUrl: { type: String, default: '' }, // Product video URL (Cloudinary or YouTube)
    codEnabled: { type: Boolean, default: true }, // COD available hai ya nahi
    advancePercent: { type: Number, default: 0 }, // Advance payment % (0 = full payment)
    emoji: { type: String, default: '👗' },
    bgColor: { type: String, default: '#F5EFE6' },
    stock: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false },
    tags: [{ type: String }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual: discount %
productSchema.virtual('discountPercent').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
