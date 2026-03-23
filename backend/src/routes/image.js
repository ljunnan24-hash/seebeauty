import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { imageUploadRateLimiter } from '../middleware/rateLimiter.js';
import imageService, { upload } from '../services/imageService.js';
import taskService from '../services/taskService.js';
import { ImageAsset, User, Subscription } from '../models/index.js';
import logger from '../config/logger.js';

const router = express.Router();

// Upload image endpoint
router.post('/upload',
  authenticate,
  imageUploadRateLimiter,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 'ERR_NO_FILE',
          message: 'No image file provided'
        });
      }

      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({
          code: 'ERR_USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      const activeSubscription = await Subscription.findOne({
        where: {
          user_id: req.userId,
          status: 'active'
        }
      });

      if (user.plan !== 'pro' && !activeSubscription && user.remaining_credits <= 0) {
        return res.status(403).json({
          code: 'ERR_NO_CREDITS',
          message: 'No remaining credits. Please purchase more credits or subscribe.',
          remainingCredits: 0
        });
      }

      // 处理上传的图片
      const result = await imageService.processUploadedImage(req.file, req.userId);

      // 启动内容审核
      imageService.moderateImage(result.image.id).catch(err => {
        logger.error('Background moderation failed:', err);
      });

      // 创建评分任务
      // Normalize modules: front-end sends JSON.stringify([...])
      let modules = req.body.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch (e) {
          // fallback: single module string
          modules = [modules];
        }
      }
      if (!Array.isArray(modules) || modules.length === 0) {
        modules = ['face'];
      }
      // Deduplicate & whitelist
      const allowed = ['face','figure','outfit','photography','others'];
      modules = [...new Set(modules)].filter(m => allowed.includes(m));
      if (modules.length === 0) modules = ['face'];

      const task = await taskService.createRatingTask({
        userId: req.userId,
        imageId: result.image.id,
        modules,
        mode: req.body.mode || 'normal',
        userDescription: req.body.description
      });

      // 扣减使用次数（订阅用户不扣减）
      if (user.plan !== 'pro' && !activeSubscription) {
        await user.decrement('remaining_credits', { by: 1 });
        logger.info(`用户 ${req.userId} 使用了1次评分，剩余 ${user.remaining_credits - 1} 次`);
      }

      res.status(201).json({
        imageId: result.image.id,
        taskId: task.id,
        status: 'processing',
        message: 'Image uploaded successfully',
        remainingCredits: user.plan === 'pro' || activeSubscription ? -1 : user.remaining_credits - 1 // -1 表示无限
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get image status
router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    const image = await ImageAsset.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      }
    });

    if (!image) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Image not found'
      });
    }

    res.json({
      id: image.id,
      status: image.status,
      safeFlags: image.safe_flags,
      metadata: {
        width: image.width,
        height: image.height,
        size: image.size_bytes,
        mime: image.content_mime
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete image
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await imageService.deleteImage(req.params.id, req.userId);

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;