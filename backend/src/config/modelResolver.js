// Centralized OpenAI model resolution logic
// Priority order:
//   Vision: OPENAI_VISION_MODEL -> OPENAI_MODEL -> default
//   Chat:   OPENAI_MODEL -> fallback list
// Handles deprecated model name mapping.

import logger from './logger.js';

const deprecatedMap = {
  'gpt-4-vision-preview': 'gpt-4o-mini',
  'gpt-4-turbo-vision': 'gpt-4o',
  'gpt-4-turbo-preview': 'gpt-4o-mini'
};

const defaultChat = 'gpt-4o-mini';
const defaultVision = 'gpt-4o-mini';

function normalize(name, type) {
  if (!name) return type === 'vision' ? defaultVision : defaultChat;
  const mapped = deprecatedMap[name] || name;
  if (mapped !== name) {
    logger.warn(`Model '${name}' deprecated. Using '${mapped}' instead.`);
  }
  return mapped;
}

export function getChatModel() {
  return normalize(process.env.OPENAI_MODEL, 'chat');
}

export function getVisionModel() {
  return normalize(process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL, 'vision');
}

export default { getChatModel, getVisionModel };
