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

// Dynamic storage — watermark setting check karke transformation apply karo
async function getStorage() {
  let wmSetting = { enabled: false, text: 'riwayat-pakistan.online', opacity: 0.35, gravity: 'south_east', fontSize: 28 };
  try {
    const s = await Settings.findOne({ key: 'watermark' });
    if (s && s.value) wmSetting = s.value;
  } catch (e) {}

  const transformations = [
    { width: 800, height: 1067, crop: 'fill', quality: 'auto' }
  ];

  if (wmSetting.enabled) {
    transformations.push({
      overlay: {
        font_family: 'Arial',
        font_size: wmSetting.fontSize || 28,
        text: wmSetting.text || 'riwayat-pakistan.online',
      },
      opacity: Math.round((wmSetting.opacity || 0.35) * 100),
      gravity: wmSetting.gravity || 'south_east',
      x: 10,
      y: 10,
      color: 'white',
    });
  }

  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'riwayat-products',
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      transformation: transformations,
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  }
};

// Middleware jo har request pe fresh watermark setting check kare
const dynamicUpload = async (req, res, next) => {
  const storage = await getStorage();
  const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 6 } });
  upload.array('images', 6)(req, res, next);
};

module.exports = dynamicUpload;
