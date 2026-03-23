import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 动态导入服务
async function testModeComparison() {
  try {
    console.log('='.repeat(80));
    console.log('测试Normal Mode vs Roast Mode差异');
    console.log('='.repeat(80));

    // 导入AI服务
    const { default: aiService } = await import('../services/aiScoringService.js');

    // 相同的测试数据
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
      selectedModules: ['face'],
      userDescription: 'Casual portrait photo with neutral expression'
    };

    console.log('\n🔹 测试Normal Mode...');
    const normalData = { ...testData, mode: 'normal' };
    const normalPrompt = aiService.buildPrompt(normalData);

    console.log('\n📝 Normal Mode提示词关键部分:');
    console.log('Mode:', normalData.mode);
    console.log('系统提示词类型:', 'getNormalSystemPrompt()');

    const normalResult = await aiService.callAI({
      prompt: normalPrompt,
      mode: 'normal',
      seed: 12345
    });

    console.log('\n🔥 测试Roast Mode...');
    const roastData = { ...testData, mode: 'roast' };
    const roastPrompt = aiService.buildPrompt(roastData);

    console.log('\n📝 Roast Mode提示词关键部分:');
    console.log('Mode:', roastData.mode);
    console.log('系统提示词类型:', 'getRoastSystemPrompt()');

    const roastResult = await aiService.callAI({
      prompt: roastPrompt,
      mode: 'roast',
      seed: 12345
    });

    // 解析结果
    const normalParsed = normalResult.parsedOutput || aiService.parseResponse(normalResult.rawOutput);
    const roastParsed = roastResult.parsedOutput || aiService.parseResponse(roastResult.rawOutput);

    const { normalized: normalNormalized } = aiService.validateAndNormalize(normalParsed, 'normal');
    const { normalized: roastNormalized } = aiService.validateAndNormalize(roastParsed, 'roast');

    console.log('\n' + '='.repeat(80));
    console.log('📊 对比结果');
    console.log('='.repeat(80));

    // 比较面部第一个维度的评论
    console.log('\n🔸 面部第一个维度评论对比:');
    console.log('Normal:', normalNormalized.modules.face[0].comment);
    console.log('Roast  :', roastNormalized.modules.face[0].comment);

    // 比较建议
    console.log('\n🔸 面部第一个维度建议对比:');
    console.log('Normal:', normalNormalized.modules.face[0].tip);
    console.log('Roast  :', roastNormalized.modules.face[0].tip);

    // 比较总结
    console.log('\n🔸 总结对比:');
    console.log('Normal:', normalNormalized.summary);
    console.log('Roast  :', roastNormalized.summary);

    // 检查ModuleBurns
    console.log('\n🔸 ModuleBurns (仅Roast模式):');
    console.log('Normal:', normalNormalized.moduleBurns || 'null');
    console.log('Roast  :', roastNormalized.moduleBurns?.face || 'null');

    // 检查评价/建议
    console.log('\n🔸 Evaluation对比:');
    console.log('Normal:', normalNormalized.evaluation[0]);
    console.log('Roast  :', roastNormalized.evaluation[0]);

    console.log('\n🔸 Recommendations对比:');
    console.log('Normal:', normalNormalized.recommendations[0]);
    console.log('Roast  :', roastNormalized.recommendations[0]);

    // 分析差异程度
    const differences = [];

    if (normalNormalized.modules.face[0].comment === roastNormalized.modules.face[0].comment) {
      differences.push('❌ 面部评论相同');
    } else {
      differences.push('✅ 面部评论不同');
    }

    if (normalNormalized.summary === roastNormalized.summary) {
      differences.push('❌ 总结相同');
    } else {
      differences.push('✅ 总结不同');
    }

    if (!roastNormalized.moduleBurns || !roastNormalized.moduleBurns.face) {
      differences.push('❌ Roast模式缺少ModuleBurns');
    } else {
      differences.push('✅ Roast模式有ModuleBurns');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 差异分析结果:');
    differences.forEach(diff => console.log(diff));

    if (differences.filter(d => d.includes('❌')).length > 0) {
      console.log('\n⚠️  检测到模式区别不够明显，需要改进提示词！');
    } else {
      console.log('\n🎉 两个模式输出差异明显，工作正常！');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n模式对比测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testModeComparison();