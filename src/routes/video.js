const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — file Cloudinary pe jayegi
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|ogg|mov|jpg|jpeg|png|webp/;
    if (allowed.test(file.originalname.toLowerCase().split('.').pop())) {
      cb(null, true);
    } else {
      cb(new Error('Sirf MP4, WebM, MOV ya image files allowed hain'));
    }
  },
});

// GET /api/video — public
router.get('/', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'hero_video' });
    res.json({
      success: true,
      video: setting ? setting.value : { active: false, url: '', opacity: 0.6 },
    });
  } catch (err) {
    res.json({ success: true, video: { active: false, url: '', opacity: 0.6 } });
  }
});

// POST /api/video/upload — admin only
router.post('/upload', protect, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Koi file nahi mili' });

  const opacity = parseFloat(req.body.opacity) || 0.5;
  const isVideo = /mp4|webm|ogg|mov/.test(req.file.originalname.toLowerCase().split('.').pop());

  try {
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'riwayat-hero',
          resource_type: isVideo ? 'video' : 'image',
          public_id: `hero-${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const videoUrl = uploadResult.secure_url;

    await Settings.findOneAndUpdate(
      { key: 'hero_video' },
      { key: 'hero_video', value: { active: true, url: videoUrl, opacity } },
      { upsert: true, new: true }
    );

    res.json({ success: true, video: { active: true, url: videoUrl, opacity } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/video/settings — update opacity/active
router.put('/settings', protect, async (req, res) => {
  const { active, opacity } = req.body;
  const setting = await Settings.findOne({ key: 'hero_video' });
  const current = setting ? setting.value : { url: '' };

  await Settings.findOneAndUpdate(
    { key: 'hero_video' },
    { key: 'hero_video', value: { ...current, active, opacity: parseFloat(opacity) || 0.5 } },
    { upsert: true, new: true }
  );

  res.json({ success: true });
});

// DELETE /api/video — remove video
router.delete('/', protect, async (req, res) => {
  await Settings.findOneAndUpdate(
    { key: 'hero_video' },
    { key: 'hero_video', value: { active: false, url: '', opacity: 0.5 } },
    { upsert: true }
  );
  res.json({ success: true, message: 'Video hata di gayi' });
});

module.exports = router;
