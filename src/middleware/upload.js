const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Settings = require('../models/Settings');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getWatermarkTransformations() {
  let wm = { enabled: false, text: 'riwayat-pakistan.online', opacity: 0.35, gravity: 'south_east', fontSize: 28 };
  try {
    const s = await Settings.findOne({ key: 'watermark' });
    if (s && s.value) wm = s.value;
  } catch (e) {}

  const t = [{ width: 800, height: 1067, crop: 'fill', quality: 'auto' }];
  if (wm.enabled) {
    t.push({
      overlay: { font_family: 'Arial', font_size: wm.fontSize || 28, text: wm.text || 'riwayat-pakistan.online' },
      opacity: Math.round((wm.opacity || 0.35) * 100),
      gravity: wm.gravity || 'south_east',
      x: 10, y: 10, color: 'white',
    });
  }
  return t;
}

const dynamicUpload = async (req, res, next) => {
  try {
    const transformations = await getWatermarkTransformations();

    const storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        if (file.fieldname === 'productVideo') {
          return {
            folder: 'riwayat-product-videos',
            resource_type: 'video',
            allowed_formats: ['mp4', 'webm', 'ogg', 'mov'],
          };
        }
        return {
          folder: 'riwayat-products',
          allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
          transformation: transformations,
        };
      },
    });

    const fileFilter = (req, file, cb) => {
      if (file.fieldname === 'productVideo') {
        if (file.mimetype.startsWith('video/')) return cb(null, true);
        return cb(new Error('Only video files allowed'));
      }
      const ok = /jpeg|jpg|png|webp/;
      if (ok.test(path.extname(file.originalname).toLowerCase()) && ok.test(file.mimetype)) {
        return cb(null, true);
      }
      cb(new Error('Only JPEG, PNG and WebP allowed'));
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: 100 * 1024 * 1024 },
    }).fields([
      { name: 'images', maxCount: 6 },
      { name: 'productVideo', maxCount: 1 },
    ]);

    upload(req, res, (err) => {
      if (err) return next(err);

      const fields = req.files || {};

      // Controller expects req.files as array of image files
      req.files = fields.images || [];

      // If video uploaded, put URL in req.body
      if (fields.productVideo && fields.productVideo.length > 0) {
        const vid = fields.productVideo[0];
        req.body.videoUrl = vid.path || vid.secure_url || '';
      }

      next();
    });

  } catch (e) {
    next(e);
  }
};

module.exports = dynamicUpload;
