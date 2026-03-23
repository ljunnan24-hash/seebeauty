import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 动态导入服务
async function testAIScoring() {
  try {
    console.log('='.repeat(60));
    console.log('测试AI评分服务完整性');
    console.log('='.repeat(60));

    // 导入AI服务
    const { default: aiService } = await import('../services/aiScoringService.js');

    // 准备测试数据
    const testData = {
      base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      features: {
        gender: 'female',
        age: 25,
        race: 'asian',
        skinTone: 'light',
        hairStyle: 'long straight',
        clothing: 'casual dress'
      },
      selectedModules: ['face', 'figure', 'outfit', 'photography', 'others'],
      userDescription: 'Test photo for scoring validation',
      mode: 'normal'
    };

    console.log('\n1. 构建提示词...');
    const prompt = aiService.buildPrompt(testData);
    console.log('   提示词长度:', prompt.length, '字符');

    console.log('\n2. 调用OpenAI API...');
    const startTime = Date.now();
    const result = await aiService.callAI({
      prompt: prompt,
      mode: 'normal',
      seed: 12345
    });
    const duration = Date.now() - startTime;
    console.log('   API响应时间:', duration, 'ms');

    console.log('\n3. 验证响应结构...');

    // 检查是否有parsedOutput
    if (result.parsedOutput) {
      console.log('   结构化输出成功返回');
    } else {
      console.log('   没有结构化输出，需要手动解析');
    }

    // 解析响应
    console.log('\n4. 解析AI响应...');
    const parsed = result.parsedOutput || aiService.parseResponse(result.rawOutput);
    console.log('   解析结果类型:', typeof parsed);
    console.log('   包含字段:', parsed ? Object.keys(parsed) : 'null');

    console.log('\n5. 验证和归一化数据...');
    let result2;
    try {
      result2 = aiService.validateAndNormalize(parsed, 'normal');
      console.log('   验证成功');
      console.log('   归一化结果包含字段:', result2 ? Object.keys(result2) : 'null');
    } catch (validateError) {
      console.log('   验证失败:', validateError.message);
      console.log('\n   原始响应预览:');
      console.log(JSON.stringify(parsed, null, 2).substring(0, 800));
      throw validateError;
    }

    // 获取normalized数据
    const normalized = result2.normalized;
    const warnings = result2.warnings || [];

    if (warnings.length > 0) {
      console.log('\n   警告信息:');
      warnings.forEach(w => console.log('   -', w));
    }

    // 验证各个字段
    console.log('\n6. 验证响应完整性:');

    // 检查radar
    const radarModules = ['face', 'figure', 'outfit', 'photography', 'others'];
    let radarValid = true;
    radarModules.forEach(module => {
      if (!normalized.radar[module] || normalized.radar[module].length !== 5) {
        console.log(`   radar.${module} 缺失或不完整`);
        radarValid = false;
      }
    });
    if (radarValid) {
      console.log('   Radar数据完整');
    }

    // 检查modules
    let modulesValid = true;
    radarModules.forEach(module => {
      if (!normalized.modules[module] || normalized.modules[module].length !== 5) {
        console.log(`   modules.${module} 缺失或不完整`);
        modulesValid = false;
      } else {
        // 检查每个dimension
        normalized.modules[module].forEach((dim, idx) => {
          if (!dim.dimension || !dim.comment || !dim.tip) {
            console.log(`   modules.${module}[${idx}] 字段不完整`);
            modulesValid = false;
          }
        });
      }
    });
    if (modulesValid) {
      console.log('   Modules数据完整');
    }

    // 检查highlights
    if (normalized.highlights && normalized.highlights.length >= 3 && !warnings.includes('highlights_padded')) {
      console.log('   Highlights完整 (' + normalized.highlights.length + '项)');
    } else {
      console.log('   ⚠️  Highlights不足 (使用了默认值)');
    }

    // 检查improvements
    if (normalized.improvements && normalized.improvements.length >= 3 && !warnings.includes('improvements_padded')) {
      console.log('   Improvements完整 (' + normalized.improvements.length + '项)');
    } else {
      console.log('   ⚠️  Improvements不足 (使用了默认值)');
    }

    // 检查summary
    if (normalized.summary && normalized.summary.length > 20 && !warnings.includes('summary_default')) {
      console.log('   Summary完整 (长度:' + normalized.summary.length + ')');
    } else {
      console.log('   ⚠️  Summary缺失或太短 (使用了默认值)');
    }

    console.log('\n7. 输出示例数据:');
    console.log('   Face模块第一项:');
    console.log('   ', JSON.stringify(normalized.modules.face[0], null, 2));
    console.log('   第一个Highlight:', normalized.highlights[0]);
    console.log('   第一个Improvement:', normalized.improvements[0]);
    console.log('   Summary预览:', normalized.summary.substring(0, 100) + '...');

    console.log('\n' + '='.repeat(60));
    console.log('AI评分服务测试完成');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n测试失败:', error.message);
    console.error('错误详情:', error);

    if (error.message === 'AI_SCORING_OPENAI_ERROR') {
      console.error('\n可能的原因：');
      console.error('1. OpenAI API密钥无效');
      console.error('2. 代理连接失败');
      console.error('3. API配额用尽');
    }
  }
}

// 运行测试
testAIScoring();