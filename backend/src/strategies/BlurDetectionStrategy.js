const ValidationStrategy = require('./ValidationStrategy');
const sharp = require('sharp');

// Variance of the Laplacian on a fixed-size greyscale copy. Scoring at a fixed
// size keeps the threshold comparable across a 2MP and a 48MP photo.
const ANALYSIS_SIZE = 800;

class BlurDetectionStrategy extends ValidationStrategy {
  constructor(threshold = 100) {
    super();
    this.threshold = threshold;
  }

  async execute({ analysis }) {
    try {
      const { data, info } = await sharp(analysis)
        .resize(ANALYSIS_SIZE, ANALYSIS_SIZE, { fit: 'inside', withoutEnlargement: true })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height } = info;

      // 3x3 Laplacian [0,1,0 / 1,-4,1 / 0,1,0]; running sums avoid allocating a per-pixel array.
      let sum = 0;
      let sumSq = 0;
      let n = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = y * width + x;
          const v = data[i - width] + data[i + width] + data[i - 1] + data[i + 1] - 4 * data[i];
          sum += v;
          sumSq += v * v;
          n++;
        }
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      if (variance < this.threshold) {
        return {
          isValid: false,
          reason: `Image is too blurry (focus score ${Math.round(variance)}, needs ${this.threshold}+).`,
        };
      }
      return { isValid: true };
    } catch (error) {
      console.error('Blur Detection Error:', error);
      return { isValid: false, reason: 'Could not analyze image clarity.' };
    }
  }
}

module.exports = BlurDetectionStrategy;
