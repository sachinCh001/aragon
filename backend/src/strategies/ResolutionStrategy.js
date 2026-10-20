const ValidationStrategy = require('./ValidationStrategy');

class ResolutionStrategy extends ValidationStrategy {
  constructor({ minWidth, minHeight }) {
    super();
    this.minWidth = minWidth;
    this.minHeight = minHeight;
  }

  async execute({ width, height }) {
    if (width < this.minWidth || height < this.minHeight) {
      return {
        isValid: false,
        reason: `Resolution too low (${width}×${height}). Minimum is ${this.minWidth}×${this.minHeight}.`,
      };
    }
    return { isValid: true };
  }
}

module.exports = ResolutionStrategy;
