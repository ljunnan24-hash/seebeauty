import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import taskService from '../services/taskService.js';

const router = express.Router();

// Get task status
router.get('/:taskId/status', authenticate, async (req, res, next) => {
  try {
    const status = await taskService.getTaskStatus(req.params.taskId);

    if (!status) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Task not found'
      });
    }

    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Cancel task
router.post('/:taskId/cancel', authenticate, async (req, res, next) => {
  try {
    const cancelled = await taskService.cancelTask(req.params.taskId);

    if (!cancelled) {
      return res.status(404).json({
        code: 'ERR_NOT_FOUND',
        message: 'Task not found or already completed'
      });
    }

    res.json({
      message: 'Task cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get queue statistics (admin only in production)
router.get('/queue/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await taskService.getQueueStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;