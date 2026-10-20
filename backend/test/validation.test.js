const test = require('node:test');
const assert = require('node:assert');
const sharp = require('sharp');

const { detectImageType } = require('../src/utils/fileType');
const ResolutionStrategy = require('../src/strategies/ResolutionStrategy');
const BlurDetectionStrategy = require('../src/strategies/BlurDetectionStrategy');
const SimilarityStrategy = require('../src/strategies/SimilarityStrategy');
const FaceDetectionStrategy = require('../src/strategies/FaceDetectionStrategy');

const noise = (w, h) => {
  const data = Buffer.alloc(w * h * 3);
  for (let i = 0; i < data.length; i++) data[i] = Math.floor(Math.random() * 256);
  return sharp(data, { raw: { width: w, height: h, channels: 3 } });
};
const jpeg = (s) => s.jpeg().toBuffer();
const asImage = (buffer, width = 800, height = 800) => ({ buffer, analysis: buffer, width, height });

test('detectImageType uses magic bytes, not the extension', async () => {
  const png = await noise(32, 32).png().toBuffer();
  const jpg = await jpeg(noise(32, 32));
  assert.strictEqual(detectImageType(png).mime, 'image/png');
  assert.strictEqual(detectImageType(jpg).mime, 'image/jpeg');
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(16)]);
  assert.strictEqual(detectImageType(heic).mime, 'image/heic');
  assert.strictEqual(detectImageType(Buffer.from('<?php echo 1; ?> not an image at all')), null);
  assert.strictEqual(detectImageType(Buffer.from('RIFFxxxxWEBPVP8 ')), null); // webp not allowed
});

test('resolution: rejects small, accepts large', async () => {
  const s = new ResolutionStrategy({ minWidth: 512, minHeight: 512 });
  assert.strictEqual((await s.execute({ width: 300, height: 900 })).isValid, false);
  assert.strictEqual((await s.execute({ width: 900, height: 300 })).isValid, false);
  assert.strictEqual((await s.execute({ width: 512, height: 512 })).isValid, true);
});

test('blur: sharp noise passes, blurred copy is rejected', async () => {
  const s = new BlurDetectionStrategy(100);
  const sharpBuf = await jpeg(noise(800, 800));
  const blurBuf = await jpeg(noise(800, 800).blur(8));
  assert.strictEqual((await s.execute(asImage(sharpBuf))).isValid, true);
  const r = await s.execute(asImage(blurBuf));
  assert.strictEqual(r.isValid, false);
  assert.match(r.reason, /blurry/);
});

test('similarity: near-duplicate rejected, different image accepted, hash returned', async () => {
  const scene = (shapes) => jpeg(sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#888"/>${shapes}</svg>`)));
  const a = await scene('<circle cx="180" cy="200" r="120" fill="#fff"/><rect x="330" y="300" width="220" height="240" fill="#111"/>');
  const b = await scene('<rect x="40" y="380" width="500" height="60" fill="#fff"/><circle cx="450" cy="120" r="90" fill="#000"/><rect x="60" y="60" width="120" height="200" fill="#ddd"/>');

  const { generateDHash, hammingDistance } = SimilarityStrategy;
  const hashA = await generateDHash(a);
  const repo = { findAcceptedHashes: async () => [hashA] };
  const s = new SimilarityStrategy('u', { maxDistance: 24, repo });

  const reencoded = await sharp(a).resize(300).jpeg({ quality: 50 }).toBuffer();
  assert.ok(hammingDistance(hashA, await generateDHash(reencoded)) <= 24);
  assert.strictEqual((await s.execute(asImage(reencoded))).isValid, false);

  const ok = await s.execute(asImage(b));
  assert.strictEqual(ok.isValid, true);
  assert.strictEqual(ok.metadata.pHash.length, 256);
});

test('face: model loads from disk and a faceless image is rejected', async () => {
  const s = new FaceDetectionStrategy();
  const buf = await jpeg(noise(640, 640).blur(5));
  const r = await s.execute(asImage(buf));
  assert.strictEqual(r.isValid, false);
  assert.strictEqual(r.reason, 'No face detected.');
});
