// 火山方舟（豆包）推理接入点模型 ID
// 文档：https://www.volcengine.com/docs/82379/1298459

import logger from './logger.js';

const DEFAULT_VISION = 'doubao-seed-2-0-mini-260215';
const DEFAULT_CHAT = 'doubao-seed-2-0-mini-260215';

function pickVision() {
  return (
    process.env.ARK_VISION_MODEL
    || process.env.DOUBAO_VISION_MODEL
    || process.env.ARK_MODEL
    || process.env.DOUBAO_MODEL
    || DEFAULT_VISION
  );
}

function pickChat() {
  return (
    process.env.ARK_CHAT_MODEL
    || process.env.DOUBAO_CHAT_MODEL
    || process.env.ARK_MODEL
    || process.env.DOUBAO_MODEL
    || DEFAULT_CHAT
  );
}

export function getChatModel() {
  const hasArk = Boolean(
    process.env.ARK_CHAT_MODEL
    || process.env.DOUBAO_CHAT_MODEL
    || process.env.ARK_MODEL
    || process.env.DOUBAO_MODEL
  );
  if (process.env.OPENAI_MODEL && !hasArk) {
    logger.warn('检测到 OPENAI_MODEL，项目已改用火山方舟豆包；请设置 ARK_MODEL 或 ARK_CHAT_MODEL。');
  }
  return pickChat();
}

export function getVisionModel() {
  const hasArk = Boolean(
    process.env.ARK_VISION_MODEL
    || process.env.DOUBAO_VISION_MODEL
    || process.env.ARK_MODEL
    || process.env.DOUBAO_MODEL
  );
  if (process.env.OPENAI_VISION_MODEL && !hasArk) {
    logger.warn('检测到 OPENAI_VISION_MODEL，项目已改用火山方舟豆包；请设置 ARK_MODEL 或 ARK_VISION_MODEL。');
  }
  return pickVision();
}

export default { getChatModel, getVisionModel };
