class ImageValidator {
  constructor() {
    this.strategies = [];
  }

  addStrategy(strategy) {
    this.strategies.push(strategy);
    return this;
  }

  // Strategies run in the order added; the first failure short-circuits so the
  // cheap checks (resolution) protect the expensive ones (face detection).
  async validateAll(image) {
    const metadata = {};
    for (const strategy of this.strategies) {
      const result = await strategy.execute(image);
      if (!result.isValid) {
        return { isValid: false, reason: result.reason };
      }
      if (result.metadata) {
        Object.assign(metadata, result.metadata);
      }
    }
    return { isValid: true, metadata };
  }
}

module.exports = ImageValidator;
