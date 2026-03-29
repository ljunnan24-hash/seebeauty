import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 动态导入服务
async function testRoastMode() {
  try {
    console.log('='.repeat(60));
    console.log('测试Roast模式效果');
    console.log('='.repeat(60));

    // 导入AI服务
    const { default: aiService } = await import('../services/aiScoringService.js');

    // 模拟男性头像的特征数据
    const testData = {
      base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      features: {
        gender: 'male',
        age: 28,
        race: 'caucasian',
        skinTone: 'medium',
        hairStyle: 'short brown',
        clothing: 'casual shirt'
      },
      selectedModules: ['face', 'figure', 'outfit', 'photography', 'others'],
      userDescription: 'Casual portrait photo with neutral expression',
      mode: 'roast'
    };

    console.log('\n1. 构建Roast模式提示词...');
    const prompt = aiService.buildPrompt(testData);
    console.log('   提示词长度:', prompt.length, '字符');

    console.log('\n2. 调用火山方舟 API (Roast模式)...');
    const startTime = Date.now();
    const result = await aiService.callAI({
      prompt: prompt,
      mode: 'roast',
      seed: 12345
    });
    const duration = Date.now() - startTime;
    console.log('   API响应时间:', duration, 'ms');

    console.log('\n3. 解析和验证响应...');
    const parsed = result.parsedOutput || aiService.parseResponse(result.rawOutput);
    const { normalized } = aiService.validateAndNormalize(parsed, 'roast');

    console.log('\n4. Roast模式输出示例:');
    console.log('\n=== Module Burns ===');
    if (normalized.moduleBurns) {
      Object.entries(normalized.moduleBurns).forEach(([module, burn]) => {
        console.log(`${module}: "${burn}"`);
      });
    }

    console.log('\n=== Evaluation (Roast风格) ===');
    normalized.evaluation.forEach((evaluation, i) => {
      console.log(`${i + 1}. ${evaluation}`);
    });

    console.log('\n=== Recommendations (Roast风格) ===');
    normalized.recommendations.forEach((recommendation, i) => {
      console.log(`${i + 1}. ${recommendation}`);
    });

    console.log('\n=== Summary (Roast风格) ===');
    console.log(`"${normalized.summary}"`);

    console.log('\n=== Face模块详细评分 ===');
    normalized.modules.face.forEach((dim, i) => {
      console.log(`${i + 1}. ${dim.dimension} (${dim.score}/10)`);
      console.log(`   评价: "${dim.comment}"`);
      console.log(`   建议: "${dim.tip}"`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60));
    console.log('Roast模式测试完成！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nRoast模式测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testRoastMode();