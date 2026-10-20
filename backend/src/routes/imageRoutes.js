const express = require('express');
const multer = require('multer');
const config = require('../config/env');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Memory storage + hard limits: the worker needs the bytes anyway, and the limits bound memory per request.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileBytes, files: config.upload.maxFiles },
});

router.post('/upload', upload.array('images', config.upload.maxFiles), uploadController.uploadImage);
router.get('/user/:userId', uploadController.getUserImages);
router.get('/:id/status', uploadController.getImageStatus);
router.get('/:id/file', uploadController.getImageFile);
router.delete('/:id', uploadController.deleteImage);

module.exports = router;
