import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { ScoreReport } from '../models/index.js';
import shareCardService from '../services/shareCardService.js';
import imageService from '../services/imageService.js';
import path from 'path';

const router = express.Router();

// Get user's reports
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { ImageAsset } = await import('../models/index.js');
    const { page = 1, pageSize = 20, mode } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { user_id: req.userId };
    if (mode) where.mode = mode;

    const { count, rows } = await ScoreReport.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: ImageAsset,
          as: 'image',
          attributes: ['id', 'original_url', 'thumbnail_url', 'content_mime']
        }
      ]
    });

    res.json({
      reports: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { ImageAsset } = await import('../models/index.js');

    const report = await ScoreReport.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      },
      include: [
        {
          model: ImageAsset,
          as: 'image',
          attributes: ['id', 'original_url', 'thumbnail_url', 'content_mime', 'created_at']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Report not found'
      });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

// Generate share card
router.post('/:id/share-card', authenticate, async (req, res, next) => {
  try {
    const report = await ScoreReport.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      }
    });

    if (!report) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Report not found'
      });
    }

    const shareCard = await shareCardService.generateShareCard(report.id);
    const shareLink = await shareCardService.generateShareLink(report.id);

    const origin = `${req.protocol}://${req.get('host')}`;
    const cardUrl = new URL(shareCard.url, origin).toString();

    res.json({
      cardUrl,
      cardType: shareCard.type,
      shareLink: shareLink.url,
      socialMeta: shareCardService.generateSocialMeta(report)
    });
  } catch (error) {
    next(error);
  }
});

// Get share card image
router.get('/:id/share-card', async (req, res, next) => {
  try {
    const report = await ScoreReport.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Report not found'
      });
    }

    const shareCard = await shareCardService.generateShareCard(report.id);
    res.sendFile(path.resolve(shareCard.path));
  } catch (error) {
    next(error);
  }
});

// Delete a report (and optionally its associated image)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await ScoreReport.findOne({
      where: { id: req.params.id, user_id: req.userId }
    });

    if (!report) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Report not found'
      });
    }

    // If image exists, soft delete it (non-blocking failure)
    if (report.image_id) {
      try {
        await imageService.deleteImage(report.image_id, req.userId);
      } catch (e) {
        // Log silently; do not fail deletion of report if image deletion fails
        console.warn('Failed to delete associated image', e.message);
      }
    }

    await report.destroy();

    return res.json({
      success: true,
      message: 'Report deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;