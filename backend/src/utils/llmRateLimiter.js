import logger from '../config/logger.js';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clampDelay = (delay, maxDelay) => {
  if (!Number.isFinite(delay) || delay <= 0) {
    return 0;
  }
  return Math.min(delay, maxDelay);
};

const parseRetryAfterHeader = (value) => {
  if (!value) return null;

  const numeric = Number.parseFloat(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 1000 ? Math.ceil(numeric) : Math.ceil(numeric * 1000);
  }

  const retryDate = Date.parse(value);
  if (Number.isFinite(retryDate)) {
    const diff = retryDate - Date.now();
    if (diff > 0) {
      return diff;
    }
  }

  return null;
};

function envInt(primary, legacy, fallback) {
  return parsePositiveInt(process.env[primary] || process.env[legacy], fallback);
}

function envNum(primary, legacy, fallback) {
  return parsePositiveNumber(process.env[primary] || process.env[legacy], fallback);
}

class LlmRateLimiter {
  constructor({ maxRequests, intervalMs, maxConcurrent, defaultRetryDelayMs, maxRetries, maxRetryDelayMs }) {
    this.maxRequests = maxRequests;
    this.intervalMs = intervalMs;
    this.maxConcurrent = maxConcurrent;
    this.defaultRetryDelayMs = defaultRetryDelayMs;
    this.maxRetries = maxRetries;
    this.maxRetryDelayMs = maxRetryDelayMs;

    this.queue = [];
    this.timestamps = [];
    this.activeCount = 0;
    this.timer = null;
  }

  schedule(task, metadata = {}) {
    if (typeof task !== 'function') {
      throw new TypeError('LlmRateLimiter.schedule expects a function');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject, metadata });
      if (this.queue.length > 1) {
        const label = metadata.label ? ` [${metadata.label}]` : '';
        logger.warn(`LLM(方舟) rate limiter queue length=${this.queue.length}${label}`);
      }
      this.drain();
    });
  }

  drain() {
    if (this.activeCount >= this.maxConcurrent) {
      return;
    }

    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.intervalMs);

    if (this.queue.length === 0) {
      if (this.activeCount === 0 && this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      return;
    }

    if (this.timestamps.length >= this.maxRequests) {
      const earliest = this.timestamps[0];
      const wait = Math.max(0, this.intervalMs - (now - earliest)) + 25;
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.timer = null;
          this.drain();
        }, wait);
        if (typeof this.timer.unref === 'function') {
          this.timer.unref();
        }
        logger.warn(`LLM(方舟) rate limiter delaying next request for ${wait}ms (queue=${this.queue.length})`);
      }
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.activeCount += 1;
    this.timestamps.push(now);

    Promise.resolve()
      .then(() => item.task())
      .then(result => item.resolve(result))
      .catch(error => item.reject(error))
      .finally(() => {
        this.activeCount -= 1;
        this.drain();
      });

    if (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      this.drain();
    }
  }

  async execute(task, options = {}) {
    const { label, maxRetries = this.maxRetries } = options;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      attempt += 1;
      try {
        return await this.schedule(task, { label });
      } catch (error) {
        lastError = error;
        if (!this.isRateLimitError(error) || attempt >= maxRetries) {
          throw error;
        }

        const delayMs = this.getRetryDelay(error, attempt);
        logger.warn(`LLM(方舟) rate limit hit${label ? ` for ${label}` : ''}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  isRateLimitError(error) {
    if (!error) return false;
    const status = error.status || error.code || error?.response?.status || error?.cause?.status;
    if (status === 429) return true;
    const message = (error.message || '').toLowerCase();
    return message.includes('rate limit');
  }

  getRetryDelay(error, attempt) {
    const headers = error?.response?.headers || error?.headers;
    if (headers) {
      const retryAfter = headers['retry-after'] || headers['Retry-After'];
      if (retryAfter) {
        const headerDelay = parseRetryAfterHeader(retryAfter);
        if (headerDelay) {
          return clampDelay(headerDelay, this.maxRetryDelayMs);
        }
      }
    }

    const serverDelay = error?.response?.data?.error?.retry_after || error?.error?.retry_after;
    if (Number.isFinite(serverDelay) && serverDelay > 0) {
      const numeric = Number(serverDelay);
      const delayMs = numeric > 1000 ? Math.ceil(numeric) : Math.ceil(numeric * 1000);
      return clampDelay(delayMs, this.maxRetryDelayMs);
    }

    const base = this.defaultRetryDelayMs;
    const backoff = base * Math.pow(1.5, attempt - 1);
    const jitter = Math.floor(Math.random() * 5000);
    return clampDelay(Math.ceil(backoff + jitter), this.maxRetryDelayMs);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const limiter = new LlmRateLimiter({
  maxRequests: envInt('ARK_RPM_LIMIT', 'OPENAI_RPM_LIMIT', 3),
  intervalMs: envNum('ARK_RATE_INTERVAL_MS', 'OPENAI_RATE_INTERVAL_MS', 60_000),
  maxConcurrent: envInt('ARK_MAX_CONCURRENT', 'OPENAI_MAX_CONCURRENT', 1),
  defaultRetryDelayMs: envNum('ARK_RETRY_DELAY_MS', 'OPENAI_RETRY_DELAY_MS', 20_000),
  maxRetries: envInt('ARK_MAX_RETRIES', 'OPENAI_MAX_RETRIES', 3),
  maxRetryDelayMs: envNum('ARK_MAX_RETRY_DELAY_MS', 'OPENAI_MAX_RETRY_DELAY_MS', 60_000)
});

export default limiter;
