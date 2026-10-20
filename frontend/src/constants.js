export const MAX_FILES = 10;
export const MIN_FILES = 6;
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // keep in sync with backend MAX_FILE_MB

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const ALLOWED_EXT = /\.(jpe?g|png|heic|heif)$/i;

// Chrome/Firefox report .heic files with an empty MIME type, so fall back to the extension.
// The backend re-checks the real bytes; this is only for fast feedback.
export function isAllowedFormat(file) {
  return ALLOWED_MIME.includes(file.type) || (!file.type && ALLOWED_EXT.test(file.name));
}
