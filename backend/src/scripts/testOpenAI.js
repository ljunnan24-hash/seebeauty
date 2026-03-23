import OpenAI from 'openai';
import dotenv from 'dotenv';
import pkg from 'https-proxy-agent';
const { HttpsProxyAgent } = pkg;

// 加载环境变量
dotenv.config();

// 测试配置
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const API_KEY = process.env.OPENAI_API_KEY;

console.log('='.repeat(60));
console.log('OpenAI API 连接测试');
console.log('='.repeat(60));
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('Proxy URL:', PROXY_URL || 'Direct Connection');
console.log('Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini');
console.log('='.repeat(60));

// 测试直接连接
async function testDirectConnection() {
  console.log('\n测试直接连接（不使用代理）...');
  try {
    const openai = new OpenAI({
      apiKey: API_KEY
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      max_tokens: 10
    });

    console.log('直接连接成功！');
    console.log('响应:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('直接连接失败:', error.message);
    console.log('   错误详情:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('   提示: 连接被拒绝，可能需要代理');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   提示: 连接超时，可能需要代理或检查网络');
    } else if (error.status === 401) {
      console.log('   提示: API密钥无效或已过期');
    }
    return false;
  }
}

// 测试代理连接
async function testProxyConnection() {
  if (!PROXY_URL) {
    console.log('\n跳过代理测试（未配置代理）');
    return false;
  }

  console.log('\n测试代理连接...');
  try {
    const proxyAgent = new HttpsProxyAgent(PROXY_URL);
    const openai = new OpenAI({
      apiKey: API_KEY,
      httpAgent: proxyAgent
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      max_tokens: 10
    });

    console.log('代理连接成功！');
    console.log('响应:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('代理连接失败:', error.message);
    console.log('   错误详情:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('   提示: 代理服务器连接被拒绝，请检查代理是否运行');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   提示: 代理连接超时');
    } else if (error.status === 401) {
      console.log('   提示: API密钥无效或已过期');
    }
    return false;
  }
}

// 验证API密钥格式
function validateAPIKey() {
  console.log('\n验证API密钥格式...');
  if (!API_KEY) {
    console.log('API密钥未设置');
    return false;
  }

  if (!API_KEY.startsWith('sk-')) {
    console.log('API密钥格式不正确（应该以 sk- 开头）');
    return false;
  }

  if (API_KEY.length < 40) {
    console.log('API密钥长度不正确');
    return false;
  }

  console.log('API密钥格式正确');
  return true;
}

// 主测试函数
async function main() {
  // 验证API密钥
  const keyValid = validateAPIKey();
  if (!keyValid) {
    console.log('\n请检查 .env 文件中的 OPENAI_API_KEY 配置');
    process.exit(1);
  }

  // 测试连接
  const directSuccess = await testDirectConnection();
  const proxySuccess = await testProxyConnection();

  // 给出建议
  console.log('\n' + '='.repeat(60));
  console.log('测试结果总结：');
  if (directSuccess) {
    console.log('推荐使用直接连接（无需代理）');
    console.log('   建议在 .env 中注释掉 HTTPS_PROXY 和 HTTP_PROXY');
  } else if (proxySuccess) {
    console.log('推荐使用代理连接');
    console.log('   当前代理配置有效');
  } else {
    console.log('无法连接到OpenAI API');
    console.log('\n可能的解决方案：');
    console.log('1. 检查API密钥是否有效（可能已过期或被撤销）');
    console.log('2. 检查网络连接');
    console.log('3. 如果需要代理，确保代理服务器正在运行');
    console.log('4. 检查代理端口是否正确（当前配置: ' + (PROXY_URL || 'None') + ')');
  }
  console.log('='.repeat(60));
}

// 运行测试
main().catch(console.error);