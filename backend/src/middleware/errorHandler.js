const multer = require('multer');

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: [413, 'A file exceeds the maximum allowed size'],
  LIMIT_FILE_COUNT: [400, 'Too many files in one request'],
  LIMIT_UNEXPECTED_FILE: [400, 'Unexpected upload field'],
};

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = status >= 500 ? 'Internal Server Error' : err.message;

  if (err instanceof multer.MulterError) {
    [status, message] = MULTER_MESSAGES[err.code] || [400, err.message];
  }

  if (status >= 500) console.error(err.stack);

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
};
