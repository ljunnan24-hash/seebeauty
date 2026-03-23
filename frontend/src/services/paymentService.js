import api from './api';

/**
 * Create Stripe Checkout Session
 * @param {string} type - 'one_time' or 'subscription'
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export const createCheckoutSession = async (type) => {
  try {
    const response = await api.post('/payments/create-checkout-session', { type });
    return response.data;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

/**
 * Get user's payment history
 * @returns {Promise<Array>}
 */
export const getPaymentHistory = async () => {
  try {
    const response = await api.get('/payments/history');
    return response.data.payments;
  } catch (error) {
    console.error('Failed to get payment history:', error);
    throw error;
  }
};

/**
 * Get user's subscription info
 * @returns {Promise<Object>}
 */
export const getUserSubscription = async () => {
  try {
    const response = await api.get('/payments/subscription');
    return response.data.subscription;
  } catch (error) {
    console.error('Failed to get subscription info:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @returns {Promise<Object>}
 */
export const cancelSubscription = async () => {
  try {
    const response = await api.post('/payments/subscription/cancel');
    return response.data;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
};

export default {
  createCheckoutSession,
  getPaymentHistory,
  getUserSubscription,
  cancelSubscription
};
