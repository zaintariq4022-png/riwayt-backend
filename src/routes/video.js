const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// Video upload storage
const videoDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videoDir),
  filename: (req, file, cb) => cb(null, `hero-video-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|ogg|mov|jpg|jpeg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Sirf MP4, WebM, MOV ya JPG, PNG, WebP files allowed hain'));
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
  if (!req.file) return res.status(400).json({ success: false, message: 'Koi video file nahi mili' });

  const opacity = parseFloat(req.body.opacity) || 0.5;
  const videoUrl = `/uploads/videos/${req.file.filename}`;

  // Delete old video file
  try {
    const old = await Settings.findOne({ key: 'hero_video' });
    if (old && old.value && old.value.url) {
      const oldPath = path.join(__dirname, '../../', old.value.url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  } catch(e) {}

  await Settings.findOneAndUpdate(
    { key: 'hero_video' },
    { key: 'hero_video', value: { active: true, url: videoUrl, opacity } },
    { upsert: true, new: true }
  );

  res.json({ success: true, video: { active: true, url: videoUrl, opacity } });
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
  try {
    const setting = await Settings.findOne({ key: 'hero_video' });
    if (setting && setting.value && setting.value.url) {
      const filePath = path.join(__dirname, '../../', setting.value.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Settings.findOneAndUpdate(
      { key: 'hero_video' },
      { key: 'hero_video', value: { active: false, url: '', opacity: 0.5 } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Video hata di gayi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
