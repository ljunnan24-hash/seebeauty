import dotenv from 'dotenv';
import { createArkResponse } from '../services/arkResponsesClient.js';

dotenv.config();

const API_KEY = process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY;
const BASE = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

console.log('='.repeat(60));
console.log('火山方舟（豆包）Responses API 连接测试');
console.log('='.repeat(60));
console.log('API Key:', API_KEY ? `${String(API_KEY).slice(0, 8)}...` : 'NOT SET');
console.log('Base URL:', BASE);
console.log('='.repeat(60));

async function main() {
  if (!API_KEY) {
    console.error('\n请在 .env 中配置 ARK_API_KEY（或 DOUBAO_API_KEY）');
    process.exit(1);
  }

  try {
    const text = await createArkResponse({
      model: process.env.ARK_CHAT_MODEL || process.env.ARK_MODEL || 'doubao-seed-2-0-mini-260215',
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: '用不超过十个字说你好。' }]
        }
      ],
      max_output_tokens: 64,
      temperature: 0.2
    });
    console.log('\n调用成功，模型输出：');
    console.log(text);
  } catch (e) {
    console.error('\n调用失败:', e.message);
    if (e.cause) console.error('Cause:', e.cause);
    process.exit(1);
  }
}

main();
