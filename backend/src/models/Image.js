const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Image extends Model {}

Image.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID, // To group images by user
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tempS3Key: {
    type: DataTypes.STRING,
    allowNull: true, // Where it sits before processing; null once removed or never stored
  },
  finalS3Key: {
    type: DataTypes.STRING,
    allowNull: true, // Only populated if ACCEPTED
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pHash: {
    type: DataTypes.STRING(256), // 256-bit perceptual (difference) hash as a bit string
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Image',
  indexes: [
    // Covers the list endpoint and the similarity lookup (userId + status = 'ACCEPTED')
    { fields: ['userId', 'status'] },
  ],
});

module.exports = Image;
