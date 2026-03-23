import Stripe from 'stripe';
import { User, Payment, Subscription } from '../models/index.js';
import logger from '../config/logger.js';

// 初始化 Stripe 客户端
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * 创建或获取 Stripe 客户
 */
async function getOrCreateStripeCustomer(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 如果用户已有 Stripe 客户ID，直接返回
    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // 创建新的 Stripe 客户
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: userId
      }
    });

    // 保存 Stripe 客户ID
    await user.update({ stripe_customer_id: customer.id });

    logger.info(`Created Stripe customer for user ${userId}: ${customer.id}`);
    return customer.id;
  } catch (error) {
    logger.error('Failed to create Stripe customer:', error);
    throw error;
  }
}

/**
 * 创建 Checkout Session
 */
async function createCheckoutSession(userId, type) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 获取或创建 Stripe 客户
    const customerId = await getOrCreateStripeCustomer(userId);

    // 根据类型选择价格ID和模式
    const priceId = type === 'subscription' 
      ? process.env.STRIPE_PRICE_SUBSCRIPTION 
      : process.env.STRIPE_PRICE_PAY_PER_USE;
    
    const mode = type === 'subscription' ? 'subscription' : 'payment';

    // 创建 Checkout Session
    const sessionConfig = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: mode,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        user_id: userId,
        type: type
      }
    };

    // 如果是订阅，添加 subscription_data 以便在订阅对象中保存 user_id
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          user_id: userId
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logger.info(`Created Checkout Session for user ${userId}: ${session.id}`);
    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    logger.error('Failed to create Checkout Session:', error);
    throw error;
  }
}

/**
 * 处理支付成功（按次付费）
 */
async function handleSuccessfulPayment(session) {
  try {
    const userId = session.metadata.user_id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // 获取 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

    // 创建支付记录
    await Payment.create({
      user_id: userId,
      stripe_payment_id: paymentIntent.id,
      stripe_session_id: session.id,
      amount: session.amount_total / 100, // 转换为美元
      currency: session.currency,
      type: 'one_time',
      status: 'succeeded',
      credits_added: 1,
      metadata: {
        session_metadata: session.metadata
      }
    });

    // 增加用户使用次数
    await user.increment('remaining_credits', { by: 1 });

    logger.info(`Payment successful for user ${userId}, adding 1 usage credit`);
    return true;
  } catch (error) {
    logger.error('Failed to handle successful payment:', error);
    throw error;
  }
}

/**
 * 处理订阅创建/更新
 */
async function handleSubscriptionUpdate(stripeSubscription) {
  try {
    let userId = stripeSubscription.metadata.user_id;
    
    // 如果 metadata 中没有 user_id，尝试通过 customer_id 查找
    if (!userId) {
      const user = await User.findOne({
        where: { stripe_customer_id: stripeSubscription.customer }
      });
      
      if (!user) {
        logger.error(`User not found for Stripe customer ${stripeSubscription.customer}`);
        throw new Error('User not found');
      }
      
      userId = user.id;
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 查找或创建订阅记录
    let subscription = await Subscription.findOne({
      where: { stripe_subscription_id: stripeSubscription.id }
    });

    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      status: stripeSubscription.status,
      current_period_start: stripeSubscription.current_period_start 
        ? new Date(stripeSubscription.current_period_start * 1000) 
        : null,
      current_period_end: stripeSubscription.current_period_end 
        ? new Date(stripeSubscription.current_period_end * 1000) 
        : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
    };

    if (subscription) {
      await subscription.update(subscriptionData);
    } else {
      subscription = await Subscription.create(subscriptionData);
    }

    // 如果订阅是活跃状态，更新用户计划为 pro
    if (['active', 'trialing'].includes(stripeSubscription.status)) {
      await user.update({ plan: 'pro' });
      logger.info(`Subscription activated for user ${userId}, upgraded to pro plan`);
    } else if (['canceled', 'past_due', 'unpaid'].includes(stripeSubscription.status)) {
      // 订阅取消或过期，降级为 free
      await user.update({ plan: 'free' });
      logger.info(`Subscription cancelled for user ${userId}, downgraded to free plan`);
    }

    return subscription;
  } catch (error) {
    logger.error('处理订阅更新失败:', error);
    throw error;
  }
}

/**
 * 取消订阅
 */
async function cancelSubscription(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 查找活跃订阅
    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new Error('Active subscription not found');
    }

    // 在 Stripe 中取消订阅（在周期结束时取消）
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    );

    // 更新本地订阅记录
    await subscription.update({
      cancel_at_period_end: true
    });

    logger.info(`Subscription for user ${userId} set to cancel at period end`);
    return {
      success: true,
      subscription: stripeSubscription
    };
  } catch (error) {
    logger.error('Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * 获取用户支付历史
 */
async function getPaymentHistory(userId) {
  try {
    const payments = await Payment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    return payments;
  } catch (error) {
    logger.error('Failed to get payment history:', error);
    throw error;
  }
}

/**
 * 获取用户订阅信息
 */
async function getUserSubscription(userId) {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to get subscription information:', error);
    throw error;
  }
}

/**
 * 验证 webhook 签名
 */
function constructWebhookEvent(payload, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    logger.error('Failed to verify webhook signature:', error);
    throw error;
  }
}

export {
  stripe,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  handleSuccessfulPayment,
  handleSubscriptionUpdate,
  cancelSubscription,
  getPaymentHistory,
  getUserSubscription,
  constructWebhookEvent
};

