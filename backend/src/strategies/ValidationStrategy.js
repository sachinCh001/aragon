class ValidationStrategy {
  /**
   * @param {{ buffer: Buffer, analysis: Buffer, width: number, height: number }} image
   *   buffer   – orientation-corrected full-size image (JPEG/PNG)
   *   analysis – the same image downscaled (max 1024px) for the expensive checks
   * @returns {Promise<{isValid: boolean, reason?: string, metadata?: object}>}
   */
  async execute(image) {
    throw new Error("Method 'execute()' must be implemented.");
  }
}

module.exports = ValidationStrategy;
