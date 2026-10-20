const Image = require('../models/Image');

class ImageRepository {
  async create(data) {
    return Image.create(data);
  }

  async findById(id) {
    return Image.findByPk(id);
  }

  async findByUserId(userId) {
    return Image.findAll({
      where: { userId },
      attributes: ['id', 'status', 'rejectionReason', 'originalName', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });
  }

  // Similarity only needs the hashes: don't pull whole rows for every job.
  async findAcceptedHashes(userId) {
    const rows = await Image.findAll({
      where: { userId, status: 'ACCEPTED' },
      attributes: ['pHash'],
      raw: true,
    });
    return rows.map((r) => r.pHash).filter(Boolean);
  }

  async updateStatus(id, status, reason = null) {
    return Image.update({ status, rejectionReason: reason }, { where: { id } });
  }

  async markAsRejected(id, reason) {
    return Image.update(
      { status: 'REJECTED', rejectionReason: reason, tempS3Key: null },
      { where: { id } }
    );
  }

  async markAsAccepted(id, finalKey, pHash) {
    return Image.update(
      {
        status: 'ACCEPTED',
        finalS3Key: finalKey,
        tempS3Key: null,
        pHash,
        rejectionReason: null
      },
      { where: { id } }
    );
  }

  async delete(id) {
    return Image.destroy({ where: { id } });
  }
}

module.exports = ImageRepository;
