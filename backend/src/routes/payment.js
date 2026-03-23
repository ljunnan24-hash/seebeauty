import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import {
  createCheckoutSession,
  handleSuccessfulPayment,
  handleSubscriptionUpdate,
  cancelSubscription,
  getPaymentHistory,
  getUserSubscription,
  constructWebhookEvent
} from '../services/stripeService.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/payments/create-checkout-session
 * 创建 Stripe Checkout Session
 */
router.post('/create-checkout-session',
  authenticate,
  [
    body('type')
      .isIn(['one_time', 'subscription'])
      .withMessage('Type must be either one_time or subscription')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 'ERR_VALIDATION',
          message: 'Invalid request parameters',
          errors: errors.array()
        });
      }

      const { type } = req.body;
      const userId = req.user.id;

      const session = await createCheckoutSession(userId, type);

      res.json({
        success: true,
        sessionId: session.sessionId,
        url: session.url
      });
    } catch (error) {
      logger.error('Failed to create Checkout Session:', error);
      next(error);
    }
  }
);

/**
 * GET /api/payments/success
 * 支付成功回调页面
 */
router.get('/success', authenticate, async (req, res, next) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        code: 'ERR_MISSING_SESSION',
        message: 'Session ID is required'
      });
    }

    // 这里只是返回成功状态，实际的支付处理在 webhook 中完成
    res.json({
      success: true,
      message: 'Payment successful',
      sessionId: session_id
    });
  } catch (error) {
    logger.error('Failed to handle successful payment callback:', error);
    next(error);
  }
});

/**
 * GET /api/payments/cancel
 * 支付取消回调
 */
router.get('/cancel', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: false,
      message: 'Payment was cancelled'
    });
  } catch (error) {
    logger.error('Failed to handle payment cancellation callback:', error);
    next(error);
  }
});

/**
 * POST /api/payments/webhook
 * Stripe Webhook 处理
 * 注意：此路由必须使用 raw body，在 app.js 中特殊配置
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // 验证 webhook 签名
    const event = constructWebhookEvent(req.body, signature);

    logger.info(`Received Stripe webhook event: ${event.type}`);

    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // 处理支付成功
        if (session.mode === 'payment') {
          await handleSuccessfulPayment(session);
        } else if (session.mode === 'subscription') {
          // 订阅会在 customer.subscription.created 事件中处理
          logger.info(`Subscription Checkout Session completed: ${session.id}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        logger.info(`PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
        break;
      }

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Failed to handle webhook:', error);
    return res.status(400).json({
      code: 'ERR_WEBHOOK',
      message: error.message
    });
  }
});

/**
 * GET /api/payments/history
 * 获取用户支付历史
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await getPaymentHistory(userId);

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    logger.error('Failed to get payment history:', error);
    next(error);
  }
});

/**
 * GET /api/payments/subscription
 * 获取用户订阅信息
 */
router.get('/subscription', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await getUserSubscription(userId);

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    logger.error('Failed to get subscription information:', error);
    next(error);
  }
});

/**
 * POST /api/payments/subscription/cancel
 * 取消订阅
 */
router.post('/subscription/cancel', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at period end',
      subscription: result.subscription
    });
  } catch (error) {
    logger.error('Failed to cancel subscription:', error);
    next(error);
  }
});

export default router;

