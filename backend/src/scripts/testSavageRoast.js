import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 动态导入服务
async function testSavageRoast() {
  try {
    console.log('🔥'.repeat(80));
    console.log('测试SAVAGE ROAST MODE - 毒舌升级版');
    console.log('🔥'.repeat(80));

    // 导入AI服务
    const { default: aiService } = await import('../services/aiScoringService.js');

    // 测试数据
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
      userDescription: 'Casual portrait photo with neutral expression',
      mode: 'roast'
    };

    console.log('\n💀 启动SAVAGE ROAST模式...');
    console.log('🌡️  温度设置: 0.8 (高创意度)');
    console.log('🎯 目标: 无情但幽默的毒舌评价');

    const prompt = aiService.buildPrompt(testData);
    console.log('\n📝 提示词长度:', prompt.length, '字符');

    const startTime = Date.now();
    const result = await aiService.callAI({
      prompt: prompt,
      mode: 'roast',
      seed: Math.floor(Math.random() * 10000) // 随机种子增加变化
    });
    const duration = Date.now() - startTime;

    console.log('⚡ API响应时间:', duration, 'ms');

    const parsed = result.parsedOutput || aiService.parseResponse(result.rawOutput);
    const { normalized } = aiService.validateAndNormalize(parsed, 'roast');

    console.log('\n' + '💀'.repeat(80));
    console.log('SAVAGE ROAST 结果展示');
    console.log('💀'.repeat(80));

    // 展示ModuleBurns
    console.log('\n🔥 MODULE BURNS (一句话毒舌):');
    if (normalized.moduleBurns && normalized.moduleBurns.face) {
      console.log('Face:', `"${normalized.moduleBurns.face}"`);
    }

    // 展示详细评价
    console.log('\n💀 详细毒舌评价:');
    normalized.modules.face.forEach((dim, i) => {
      console.log(`\n${i + 1}. ${dim.dimension} (${dim.score}/10)`);
      console.log(`   💬 毒舌评价: "${dim.comment}"`);
      console.log(`   💡 savage建议: "${dim.tip}"`);
    });

    // 展示Evaluation
    console.log('\n🎯 Evaluation (毒舌版):');
    normalized.evaluation.forEach((evaluation, i) => {
      console.log(`${i + 1}. "${evaluation}"`);
    });

    // 展示Recommendations
    console.log('\n🔧 Recommendations (毒舌版):');
    normalized.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. "${rec}"`);
    });

    // 展示Summary
    console.log('\n📋 总结 (毒舌版):');
    console.log(`"${normalized.summary}"`);

    // 毒舌程度分析
    console.log('\n' + '🔍'.repeat(80));
    console.log('毒舌程度分析');
    console.log('🔍'.repeat(80));

    const savageKeywords = [
      'brutal', 'savage', 'destroy', 'obliterate', 'roast', 'burn',
      'disaster', 'tragic', 'nightmare', 'crime', 'assault', 'murder',
      'dead', 'kill', 'slaughter', 'annihilate', 'demolish'
    ];

    const allText = [
      normalized.moduleBurns?.face || '',
      ...normalized.modules.face.map(d => d.comment + ' ' + d.tip),
      ...normalized.evaluation,
      ...normalized.recommendations,
      normalized.summary
    ].join(' ').toLowerCase();

    const savageScore = savageKeywords.filter(keyword =>
      allText.includes(keyword)
    ).length;

    const funnyWords = ['like', 'looks', 'screams', 'giving', 'energy', 'vibes', 'says'];
    const humorScore = funnyWords.filter(word =>
      allText.includes(word)
    ).length;

    console.log(`\n🔥 毒舌强度: ${savageScore}/10`);
    console.log(`😂 幽默程度: ${humorScore}/10`);

    if (savageScore >= 3 && humorScore >= 3) {
      console.log('✅ SAVAGE ROAST 升级成功！毒舌又幽默！');
    } else if (savageScore >= 2) {
      console.log('⚠️  有毒舌但还可以更savage一些');
    } else {
      console.log('❌ 还不够毒舌，需要继续优化');
    }

    console.log('\n' + '🔥'.repeat(80));
    console.log('SAVAGE ROAST 测试完成！');
    console.log('🔥'.repeat(80));

  } catch (error) {
    console.error('\nSAVAGE ROAST测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testSavageRoast();