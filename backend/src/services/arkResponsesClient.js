import axios from 'axios';
import proxyAgent from '../config/proxy.js';
import logger from '../config/logger.js';

export function stripMarkdownJsonFence(text) {
  if (typeof text !== 'string') return text;
  const trimmed = text.trim();
  const full = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (full) return full[1].trim();
  const inner = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (inner) return inner[1].trim();
  return trimmed;
}

function getArkApiKey() {
  return process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY || '';
}

function getArkBaseUrl() {
  const raw = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  return raw.replace(/\/$/, '');
}

/**
 * 从火山方舟 Responses API 返回体中提取模型输出的纯文本。
 * 文档：https://www.volcengine.com/docs/82379/1783703
 */
export function extractOutputText(data) {
  if (data == null) return '';
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputs = data.output;
  if (Array.isArray(outputs)) {
    const chunks = [];
    for (const block of outputs) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'message' && Array.isArray(block.content)) {
        for (const part of block.content) {
          if (!part || typeof part !== 'object') continue;
          const t = part.type;
          if ((t === 'output_text' || t === 'text') && typeof part.text === 'string') {
            chunks.push(part.text);
          }
        }
      }
    }
    if (chunks.length) return chunks.join('').trim();
  }

  const choiceContent = data?.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string' && choiceContent.trim()) {
    return choiceContent.trim();
  }

  const fallback = collectFirstLongString(data, 80);
  if (fallback) return fallback;

  logger.warn('Ark response: could not parse output text, keys=%s', Object.keys(data).join(','));
  return '';
}

function collectFirstLongString(node, minLen, depth = 0) {
  if (depth > 12 || node == null) return '';
  if (typeof node === 'string') {
    const t = node.trim();
    return t.length >= minLen ? t : '';
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = collectFirstLongString(item, minLen, depth + 1);
      if (found) return found;
    }
    return '';
  }
  if (typeof node === 'object') {
    for (const v of Object.values(node)) {
      const found = collectFirstLongString(v, minLen, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

/**
 * POST /responses — 与 curl 示例一致：https://ark.cn-beijing.volces.com/api/v3/responses
 */
export async function createArkResponse(body, options = {}) {
  const apiKey = getArkApiKey();
  if (!apiKey) {
    throw new Error('ARK_API_KEY_OR_DOUBAO_API_KEY_MISSING');
  }

  const url = `${getArkBaseUrl()}/responses`;
  const timeoutMs = parseInt(process.env.ARK_REQUEST_TIMEOUT_MS || '120000', 10);

  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: proxyAgent || undefined,
      proxy: false,
      timeout: timeoutMs,
      validateStatus: () => true
    });

    const { status, data } = res;
    if (status >= 400) {
      const err = new Error(`ARK_HTTP_${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      err.status = status;
      err.responseBody = data;
      throw err;
    }

    if (data?.error) {
      const msg = data.error.message || JSON.stringify(data.error);
      const err = new Error(`ARK_API_ERROR: ${msg}`);
      err.status = data.error.code || data.error.status;
      err.details = data.error;
      throw err;
    }

    if (options.rawResponse) {
      return { raw: data, text: extractOutputText(data) };
    }

    return extractOutputText(data);
  } catch (error) {
    if (error.response?.data) {
      logger.error('Ark Responses request failed:', error.response.status, error.response.data);
    } else {
      logger.error('Ark Responses request failed:', error.message);
    }
    throw error;
  }
}

export default { createArkResponse, extractOutputText, stripMarkdownJsonFence };
