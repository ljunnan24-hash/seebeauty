// 火山方舟（豆包）模型 ID，与控制台推理接入点一致。
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
  const id = pickChat();
  if (process.env.OPENAI_MODEL && !process.env.ARK_CHAT_MODEL && !process.env.DOUBAO_CHAT_MODEL && !process.env.ARK_MODEL && !process.env.DOUBAO_MODEL) {
    logger.warn('OPENAI_MODEL is set but ignored; use ARK_CHAT_MODEL / ARK_MODEL for 火山方舟.');
  }
  return id;
}

export function getVisionModel() {
  const id = pickVision();
  if (process.env.OPENAI_VISION_MODEL && !process.env.ARK_VISION_MODEL && !process.env.DOUBAO_VISION_MODEL && !process.env.ARK_MODEL && !process.env.DOUBAO_MODEL) {
    logger.warn('OPENAI_VISION_MODEL is set but ignored; use ARK_VISION_MODEL / ARK_MODEL for 火山方舟.');
  }
  return id;
}

export default { getChatModel, getVisionModel };
