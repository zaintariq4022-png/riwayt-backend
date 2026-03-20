const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: [{ type: String }],
    emoji: { type: String, default: '👗' },
    bgColor: { type: String, default: '#F5EFE6' },
    stock: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false },
    tags: [{ type: String }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
