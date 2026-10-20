// Sniff the real format from magic bytes: the client-supplied MIME type is
// attacker-controlled and browsers often report HEIC as an empty string.
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']);

function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf.toString('ascii', 4, 8) === 'ftyp' && HEIC_BRANDS.has(buf.toString('ascii', 8, 12))) {
    return { ext: 'heic', mime: 'image/heic' };
  }
  return null;
}

module.exports = { detectImageType };
