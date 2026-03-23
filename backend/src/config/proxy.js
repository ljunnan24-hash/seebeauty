import pkg from 'https-proxy-agent';
const { HttpsProxyAgent } = pkg;
import logger from './logger.js';

// 代理配置
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

let proxyAgent = null;

if (PROXY_URL) {
  try {
    proxyAgent = new HttpsProxyAgent(PROXY_URL);
    logger.info(`Proxy configured: ${PROXY_URL}`);
  } catch (error) {
    logger.warn('Failed to configure proxy, using direct connection:', error.message);
  }
} else {
  logger.info('No proxy configured, using direct connection');
}

export { proxyAgent };
export default proxyAgent;