const path = require('path');
const ValidationStrategy = require('./ValidationStrategy');
require('@tensorflow/tfjs-node'); // registers the native backend for face-api
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');

// Patch node-canvas for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_DIR = path.join(__dirname, '..', 'models', 'tiny_face_detector');

// Memoised promise so concurrent first calls don't load the weights twice.
let modelsPromise = null;
function loadModels() {
  if (!modelsPromise) {
    modelsPromise = faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_DIR).catch((err) => {
      modelsPromise = null; // allow a retry on the next job
      throw err;
    });
  }
  return modelsPromise;
}

class FaceDetectionStrategy extends ValidationStrategy {
  constructor({ minFaceRatio = 0.05 } = {}) {
    super();
    this.minFaceRatio = minFaceRatio;
  }

  async execute({ analysis }) {
    await loadModels();
    const img = await canvas.loadImage(analysis);

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(img, options);

    if (detections.length === 0) {
      return { isValid: false, reason: 'No face detected.' };
    }
    if (detections.length > 1) {
      return { isValid: false, reason: `Multiple faces detected (${detections.length}). Only you should be in the photo.` };
    }

    const { width, height } = detections[0].box;
    const ratio = (width * height) / (img.width * img.height);
    if (ratio < this.minFaceRatio) {
      return { isValid: false, reason: 'Face is too small or too far away.' };
    }

    return { isValid: true };
  }
}

module.exports = FaceDetectionStrategy;
