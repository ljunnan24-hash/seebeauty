import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 动态导入服务
async function testAIService() {
  try {
    console.log('正在测试AI评分服务...');
    console.log('Ark API Key:', (process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY) ? 'Configured' : 'Not set');
    console.log('Proxy:', process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'Not configured');

    // 导入AI服务（已经是实例）
    const { default: aiService } = await import('../services/aiScoringService.js');

    // 准备测试数据
    const testPrompt = aiService.buildPrompt({
      base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      features: {
        gender: 'female',
        age: 25,
        race: 'asian'
      },
      selectedModules: ['face'],
      userDescription: 'Test image',
      mode: 'normal'
    });

    console.log('\n发送测试请求到火山方舟...');
    const result = await aiService.callAI({
      prompt: testPrompt,
      mode: 'normal',
      seed: 12345
    });

    console.log('AI服务测试成功！');
    console.log('响应摘要:', result.parsedOutput?.summary?.substring(0, 100) || 'No summary');

  } catch (error) {
    console.error('AI服务测试失败:', error.message);
    console.error('错误详情:', error);

    if (error.message === 'AI_SCORING_LLM_ERROR') {
      console.error('火山方舟 API 调用失败，请检查：');
      console.error('1. ARK_API_KEY 是否有效');
      console.error('2. 代理（HTTPS_PROXY）是否可用');
      console.error('3. 网络与模型接入点 ID 是否正确');
    }
  }
}

// 运行测试
testAIService();