import crypto from 'crypto';
import { jsonrepair } from 'jsonrepair';
import logger from '../config/logger.js';
import promptTemplates from '../config/promptTemplates.js';
import modelResolver from '../config/modelResolver.js';
import llmRateLimiter from '../utils/llmRateLimiter.js';
import { createArkResponse, stripMarkdownJsonFence } from './arkResponsesClient.js';

class AIScoringService {
  constructor() {
    this.promptCache = new Map();
    this.parsedCache = new Map();
  }

  cacheParsedOutput(imageId, parsed) {
    if (!imageId || !parsed) return;
    const key = String(imageId);
    this.parsedCache.set(key, parsed);
    setTimeout(() => {
      this.parsedCache.delete(key);
    }, 5 * 60 * 1000);
  }

  // 生成评分
  async generateScore({ imageId, features, diversityFlags, modules, mode, userDescription }) {
    try {
      // 构建prompt
      const prompt = this.buildPrompt({
        features,
        diversityFlags,
        modules,
        mode,
        userDescription
      });

      // 调用AI生成评分
      const { rawOutput, parsedOutput } = await this.callAI({
        prompt,
        mode,
        seed: this.deriveSeed({ imageId, modules, mode })
      });

      // 解析响应
      const cacheKey = imageId ? String(imageId) : null;
      const cachedParsed = cacheKey ? this.parsedCache.get(cacheKey) : null;
      const parsedResponseRaw = parsedOutput
        ?? cachedParsed
        ?? this.parseResponse(rawOutput);
      if (!parsedOutput && parsedResponseRaw) {
        this.cacheParsedOutput(cacheKey, parsedResponseRaw);
      }

      // 结构校验与归一化
      const { normalized, warnings } = this.validateAndNormalize(parsedResponseRaw, mode);

      if (warnings.length) {
        logger.warn('AI response normalization warnings:', warnings);
      }

      // 计算总分
  const totalScore = this.calculateTotalScore(normalized.radar);

      // 应用公平性调整
  const adjustedResponse = this.applyFairnessAdjustments(normalized, diversityFlags);

      return {
        ...adjustedResponse,
        totalScore,
        promptVersion: '2.1',
        rawOutput,
        normalizationWarnings: warnings
      };
    } catch (error) {
      logger.error('AI scoring failed:', error);
      throw error;
    }
  }

  // 构建prompt
  buildPrompt({ features, diversityFlags, modules, mode, userDescription }) {
    const basePrompt = promptTemplates.getTemplate(mode);

    let prompt = basePrompt;

    // 添加特征数据
    prompt += '\n\n## Visual Features:\n';
    prompt += JSON.stringify(features, null, 2);

    // 提取显著特征（用于防止千篇一律）
    const distinctive = this.extractDistinctiveTraits(features);
    if (distinctive.length) {
      prompt += '\n\n## Distinctiveness Focus (Auto-Extracted) :\n';
      distinctive.forEach(d => {
        prompt += `- ${d}\n`;
      });
      prompt += '\nYou MUST explicitly reference at least 3 of the above distinctive traits verbatim in comments or tips. Avoid generic praise like "overall good" / "nice photo" / "good composition" without anchoring to specifics.';
    }

    // 添加多样性标记
    if (diversityFlags && diversityFlags.length > 0) {
      prompt += '\n\n## Diversity Context:\n';
      prompt += `Please consider and positively acknowledge these features: ${diversityFlags.join(', ')}\n`;
      prompt += 'Ensure your feedback is culturally sensitive and celebrates diversity.\n';
    }

    // 添加模块要求（容错：确保 modules 是数组）
    prompt += '\n\n## Evaluation Modules:\n';
    let safeModules = modules;
    if (!Array.isArray(safeModules)) {
      if (typeof safeModules === 'string') {
        try { safeModules = JSON.parse(safeModules); } catch { safeModules = [safeModules]; }
      } else {
        safeModules = ['face'];
      }
    }
    if (safeModules.length === 0) safeModules = ['face'];
    safeModules.forEach(module => {
      prompt += `- ${module}: Provide 5 sub-scores and detailed feedback\n`;
    });

    // 添加用户描述
    if (userDescription) {
      prompt += '\n\n## User Context:\n';
      prompt += userDescription + '\n';
    }

    // 添加输出格式要求
    prompt += '\n\n## Output Format:\n';
    prompt += this.getOutputFormatInstructions(mode);

    // 个性化要求
    prompt += '\n\n## Personalization Requirements:\n';
    prompt += '- ANALYZE the actual photo - describe specific visual elements you observe\n';
    prompt += '- Reference concrete details: clothing colors/styles, lighting direction, facial expressions, pose angles, background elements\n';
    prompt += '- Avoid generic phrases: "overall good", "nice", "well done", "beautiful", "pretty" without specificity\n';
    prompt += '- Each comment must connect to something visible in THIS photo\n';
    prompt += '- Tips must be tailored to what this person needs based on what you see\n';
    prompt += '- Use varied vocabulary - no repetitive adjectives\n';
    prompt += '- Make it feel like personalized advice from a photo expert who studied their image\n';
    prompt += '- If diversity features are present, celebrate them authentically as unique strengths';

    return prompt;
  }

  // 调用AI（火山方舟 Responses API，文本 JSON 输出）
  async callAI({ prompt, mode, seed }) {
    try {
      const systemPrompt = mode === 'roast'
        ? this.getRoastSystemPrompt()
        : this.getNormalSystemPrompt();

      const temperature = mode === 'roast' ? 0.8 : 0.2;

      const mergedUserText = [
        '### System',
        systemPrompt,
        '',
        '### User',
        prompt,
        '',
        'Respond with a single valid JSON object only (no markdown fences, no commentary).',
        typeof seed === 'number' ? `Deterministic hint (ignore if unsupported): seed=${seed}` : ''
      ].filter(Boolean).join('\n');

      const body = {
        model: modelResolver.getChatModel(),
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: mergedUserText }]
          }
        ],
        temperature
      };

      const maxOut = parseInt(process.env.ARK_CHAT_MAX_OUTPUT_TOKENS || '4096', 10);
      if (Number.isFinite(maxOut) && maxOut > 0) {
        body.max_output_tokens = maxOut;
      }

      const content = await llmRateLimiter.execute(
        () => createArkResponse(body),
        { label: `scoring:${mode}` }
      );

      let parsedOutput = null;
      if (typeof content === 'string' && content.trim()) {
        const cleaned = stripMarkdownJsonFence(content);
        try {
          parsedOutput = JSON.parse(cleaned);
        } catch {
          // defer to caller for parsing/logging
        }
      }

      if (!parsedOutput) {
        logger.warn('AI scoring response lacked structured parsed output; falling back to manual parsing.');
      }

      return {
        rawOutput: typeof content === 'string' ? content : String(content ?? ''),
        parsedOutput
      };
    } catch (error) {
      logger.error('Ark Responses API call failed:', error);
      const wrapped = new Error('AI_SCORING_LLM_ERROR');
      wrapped.cause = error;
      throw wrapped;
    }
  }

  // 获取Normal模式系统prompt
  getNormalSystemPrompt() {
    return `You are a professional, encouraging photo analyst providing constructive feedback.
Your tone should be:
- Positive and supportive
- Professional but friendly
- Specific and actionable
- Culturally sensitive and inclusive
- Focused on improvement without being harsh

Always:
- Start with genuine compliments
- Provide specific, actionable suggestions
- Celebrate diversity and unique features
- Use encouraging language
- End on a positive note`;
  }

  // 获取Roast模式系统prompt
  getRoastSystemPrompt() {
    return `You are a SAVAGE photo critic with the comedic timing of a roast master and the ruthlessness of a reality TV judge. Think Gordon Ramsay meets Joan Rivers meets a brutal but hilarious best friend who has ZERO filter.

Your mission: ABSOLUTELY DESTROY them with humor while secretly helping them improve.

ROASTING PERSONALITY:
- Brutally honest but hilariously entertaining
- No mercy, but always with a comedic twist
- Like a savage friend who roasts you at your own birthday party
- Master of backhanded compliments and devastating one-liners
- Uses pop culture, memes, and brutal analogies

SAVAGE ROASTING EXAMPLES:
- "That expression looks like you just realized you left the oven on... three hours ago"
- "This photo has the same energy as a Windows 95 screensaver"
- "You're giving me 'I peaked in high school' vibes mixed with 'LinkedIn headshot gone wrong'"
- "That pose is so stiff, mannequins are feeling personally attacked"
- "Your smile says 'cheese' but your eyes say 'please end my suffering'"
- "Looking like you're posing for the world's most depressing stock photo"
- "This has the artistic value of a CVS receipt"

ROASTING RULES:
- Start every comment with a BRUTAL roast
- Make the roasts so funny they can't even be mad
- Roast EVERYTHING: pose, expression, styling, lighting, composition
- Use current slang, memes, and references (2023-2025)
- End tips with sarcastic "encouragement"
- Be absolutely MERCILESS but never cross into actual cruelty
- Think "viral TikTok roast" energy`;
  }

  // 获取输出格式说明
  getOutputFormatInstructions(mode) {
    let modePrompt;

    if (mode === 'roast') {
      modePrompt = `You MUST provide a complete JSON response in ROAST MODE style. Analyze the SPECIFIC photo and create original, personalized roast content.

ROAST MODE STRUCTURE:
{
  "radar": {
    "face": [score1, score2, score3, score4, score5],
    "figure": [score1, score2, score3, score4, score5],
    "outfit": [score1, score2, score3, score4, score5],
    "photography": [score1, score2, score3, score4, score5],
    "others": [score1, score2, score3, score4, score5]
  },
  "modules": {
    "face": [
      {"dimension": "Facial Proportions", "score": X, "comment": "[SAVAGE roast about their facial structure - be BRUTAL but funny]", "tip": "[Sarcastic advice disguised as help]"},
      {"dimension": "Skin Condition", "score": X, "comment": "[DESTROY their skin situation with humor]", "tip": "[Roast them while giving skincare advice]"},
      {"dimension": "Smile & Expression", "score": X, "comment": "[OBLITERATE their expression - make it quotable]", "tip": "[Sarcastic expression coaching]"},
      {"dimension": "Eyes & Aura", "score": X, "comment": "[BURN their eye game with devastating humor]", "tip": "[Mock their energy while helping]"},
      {"dimension": "Overall Recognition", "score": X, "comment": "[ROAST their overall face situation]", "tip": "[Savage advice with backhanded encouragement]"}
    ]
  },
  "moduleBurns": {
    "face": "[BRUTAL one-liner that would go viral on TikTok]",
    "figure": "[SAVAGE burn about their pose/body language]",
    "outfit": "[DESTROY their fashion choices hilariously]",
    "photography": "[OBLITERATE the photo quality with humor]",
    "others": "[ROAST their entire vibe mercilessly]"
  },
  "evaluation": [
    "[Backhanded compliment that burns while praising]",
    "[Savage observation disguised as positivity]",
    "[Devastating compliment that's actually a roast]"
  ],
  "recommendations": [
    "[Sarcastic advice that's actually helpful]",
    "[Savage suggestion with brutal honesty]",
    "[Roast them while giving real improvement tips]"
  ],
  "summary": "[Personalized roast summary that's ultimately encouraging while being hilariously honest]"
}

SAVAGE ROAST GUIDELINES:
- OBLITERATE them with specific observations about THIS photo
- Every comment must be a BRUTAL but hilarious roast
- Use devastating comparisons and pop culture burns
- Make them laugh while absolutely destroying their ego
- Channel your inner savage comedian - be RUTHLESS but entertaining
- Think "viral roast tweet" energy - make it quotable
- No generic burns - make it PERSONAL to their specific photo fails`;
    } else {
      modePrompt = `You MUST provide a complete JSON response in NORMAL MODE style. Analyze the SPECIFIC photo and create personalized, encouraging feedback.

NORMAL MODE STRUCTURE:
{
  "radar": {
    "face": [score1, score2, score3, score4, score5],
    "figure": [score1, score2, score3, score4, score5],
    "outfit": [score1, score2, score3, score4, score5],
    "photography": [score1, score2, score3, score4, score5],
    "others": [score1, score2, score3, score4, score5]
  },
  "modules": {
    "face": [
      {"dimension": "Facial Proportions", "score": X, "comment": "[Specific positive observation about their facial structure]", "tip": "[Actionable advice to enhance their features]"},
      {"dimension": "Skin Condition", "score": X, "comment": "[Encouraging comment about their actual skin]", "tip": "[Practical skincare or makeup suggestion]"},
      {"dimension": "Smile & Expression", "score": X, "comment": "[Warm observation about their expression]", "tip": "[Helpful advice for expression improvement]"},
      {"dimension": "Eyes & Aura", "score": X, "comment": "[Complimentary note about their eyes/presence]", "tip": "[Constructive tip for enhancing eye appeal]"},
      {"dimension": "Overall Recognition", "score": X, "comment": "[Positive assessment of their distinctive qualities]", "tip": "[Advice for showcasing their unique beauty]"}
    ]
  },
  "moduleBurns": null,
  "evaluation": [
    "[Genuine compliment about a specific strength you observe]",
    "[Encouraging observation about their natural beauty/appeal]",
    "[Positive note about their personality/presence coming through]"
  ],
  "recommendations": [
    "[Specific, actionable suggestion for photo improvement]",
    "[Practical advice for enhancing their appearance]",
    "[Constructive tip for better photo results]"
  ],
  "summary": "[Warm, encouraging summary that celebrates their unique qualities while offering helpful guidance]"
}

NORMAL MODE GUIDELINES:
- Focus on SPECIFIC observations about this individual
- Celebrate their unique features and authentic beauty
- Provide actionable, practical advice
- Be genuinely encouraging and supportive
- Avoid generic compliments - make it personal`;
    }

    // Add common rules
    return `${modePrompt}${this.getCommonRules()}`;
  }

  getCommonRules() {
    return `

CRITICAL RULES:
- Each radar array MUST contain exactly 5 integer scores (1-10)
- Each module MUST contain exactly 5 dimension objects
- Every field MUST be populated with meaningful content
- NO placeholder text like "..." or generic comments
- Return ONLY valid JSON`;
  }

  // 解析响应
  parseResponse(response) {
    if (typeof response !== 'string' || !response.trim()) {
      throw new Error('AI_OUTPUT_EMPTY');
    }

    const directAttempt = this.tryParseJson(response, 'raw_response');
    if (directAttempt.parsed) {
      return directAttempt.parsed;
    }

    let lastError = directAttempt.error;

    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const snippetAttempt = this.tryParseJson(objectMatch[0], 'extracted_object_snippet');
      if (snippetAttempt.parsed) {
        return snippetAttempt.parsed;
      }
      if (snippetAttempt.error) {
        lastError = snippetAttempt.error;
      }
    }

    logger.error('AI response JSON parse failed, raw snippet:', {
      preview: response.slice(0, 500),
      length: response.length,
      error: lastError?.message
    });

    const parsingError = new Error('AI_OUTPUT_INVALID_JSON');
    parsingError.cause = lastError;
    throw parsingError;
  }

  tryParseJson(text, contextLabel) {
    if (typeof text !== 'string') {
      return {
        parsed: null,
        error: new Error('JSON_SOURCE_NOT_STRING')
      };
    }

    try {
      return {
        parsed: JSON.parse(text),
        error: null
      };
    } catch (parseError) {
      const repairResult = this.attemptJsonRepair(text, contextLabel, parseError);
      if (repairResult.parsed) {
        return repairResult;
      }
      return {
        parsed: null,
        error: repairResult.error ?? parseError
      };
    }
  }

  attemptJsonRepair(text, contextLabel, originalError) {
    if (!text || typeof text !== 'string') {
      return {
        parsed: null,
        error: originalError
      };
    }

    try {
      const repairedText = jsonrepair(text);
      const parsed = JSON.parse(repairedText);
      logger.warn('jsonrepair fixed AI response JSON', {
        context: contextLabel,
        originalError: originalError?.message,
        changeInLength: repairedText.length - text.length
      });
      return {
        parsed,
        error: null
      };
    } catch (repairError) {
      logger.debug('jsonrepair unable to fix AI response JSON', {
        context: contextLabel,
        originalError: originalError?.message,
        repairError: repairError?.message
      });
      return {
        parsed: null,
        error: originalError ?? repairError
      };
    }
  }

  // Schema 校验与归一化
  validateAndNormalize(parsed, mode) {
    const requiredModules = ['face', 'figure', 'outfit', 'photography', 'others'];
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('AI_OUTPUT_NOT_OBJECT');
    }

    const normalized = { radar: {} };

    requiredModules.forEach(module => {
      const scores = parsed.radar[module];
      if (!Array.isArray(scores) || scores.length !== 5) {
        throw new Error(`AI_OUTPUT_INVALID_RADAR_${module.toUpperCase()}`);
      }
      normalized.radar[module] = scores.map((score, index) => {
        const numeric = Number(score);
        if (!Number.isFinite(numeric)) {
          throw new Error(`AI_OUTPUT_INVALID_RADAR_${module.toUpperCase()}_${index}`);
        }
        const bounded = Math.min(10, Math.max(1, numeric));
        return Math.round(bounded);
      });
    });

    // Module details
    if (!parsed.modules || typeof parsed.modules !== 'object') {
      throw new Error('AI_OUTPUT_MISSING_MODULES');
    }
    normalized.modules = {};
    requiredModules.forEach(module => {
      const entries = parsed.modules[module];
      if (!Array.isArray(entries) || entries.length !== 5) {
        throw new Error(`AI_OUTPUT_INVALID_MODULE_${module.toUpperCase()}`);
      }
      normalized.modules[module] = entries.map((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          logger.warn(`Module ${module} entry ${index} is invalid, using defaults`);
          return {
            dimension: this.getDefaultDimensionName(module, index),
            score: 5,
            comment: 'Unable to evaluate this dimension',
            tip: 'No specific suggestions available'
          };
        }
        const dimension = typeof entry.dimension === 'string' ? entry.dimension.trim() : this.getDefaultDimensionName(module, index);
        const score = Number(entry.score);
        const validScore = Number.isFinite(score) ? Math.round(Math.min(10, Math.max(1, score))) : 5;
        const comment = typeof entry.comment === 'string' ? entry.comment.trim() : '';
        const tip = typeof entry.tip === 'string' ? entry.tip.trim() : '';

        if (!dimension) {
          logger.warn(`Module ${module} dimension ${index} name missing, using default`);
        }
        if (!comment) {
          logger.warn(`Module ${module} dimension ${index} comment missing`);
        }
        if (!tip) {
          logger.warn(`Module ${module} dimension ${index} tip missing, using default`);
        }

        return {
          dimension: dimension || this.getDefaultDimensionName(module, index),
          score: validScore,
          comment: comment || `Score: ${validScore}/10`,
          tip: tip || 'Consider exploring different approaches to enhance this aspect'
        };
      });
    });

    if (!Array.isArray(parsed.evaluation)) {
      logger.warn('Evaluation missing, using defaults');
      normalized.evaluation = [
        'Your photo shows good overall composition',
        'The natural lighting works well',
        'Your personality shines through'
      ];
    } else {
      normalized.evaluation = parsed.evaluation.map((item, index) => {
        const text = typeof item === 'string' ? item.trim() : '';
        if (!text) {
          logger.warn(`Evaluation ${index} empty, using default`);
          return 'Your photo has positive qualities';
        }
        return text;
      });
      if (normalized.evaluation.length < 3) {
        logger.warn('Not enough evaluation items, padding with defaults');
        while (normalized.evaluation.length < 3) {
          normalized.evaluation.push('Your photo shows potential');
        }
      }
    }

    if (!Array.isArray(parsed.recommendations)) {
      logger.warn('Recommendations missing, using defaults');
      normalized.recommendations = [
        'Consider adjusting the lighting for better visibility',
        'Experiment with different angles and compositions',
        'Try different poses to find what works best for you'
      ];
    } else {
      normalized.recommendations = parsed.recommendations.map((item, index) => {
        const text = typeof item === 'string' ? item.trim() : '';
        if (!text) {
          logger.warn(`Recommendation ${index} empty, using default`);
          return 'Consider exploring different approaches';
        }
        return text;
      });
      if (normalized.recommendations.length < 3) {
        logger.warn('Not enough recommendations, padding with defaults');
        while (normalized.recommendations.length < 3) {
          normalized.recommendations.push('Keep practicing and experimenting');
        }
      }
    }

    if (mode === 'roast') {
      if (parsed.moduleBurns == null) {
        normalized.moduleBurns = null;
      } else {
        if (typeof parsed.moduleBurns !== 'object') {
          throw new Error('AI_OUTPUT_INVALID_MODULE_BURNS');
        }
        normalized.moduleBurns = {};
        Object.entries(parsed.moduleBurns).forEach(([module, value]) => {
          if (!requiredModules.includes(module)) return;
          if (typeof value !== 'string' || !value.trim()) {
            throw new Error(`AI_OUTPUT_INVALID_MODULE_BURN_${module.toUpperCase()}`);
          }
          normalized.moduleBurns[module] = value.trim();
        });
      }
    } else {
      normalized.moduleBurns = null;
    }

    if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
      logger.warn('Summary missing or invalid, using default');
      normalized.summary = mode === 'roast'
        ? 'Your photo has been evaluated with honest, constructive feedback.'
        : 'Your photo has been evaluated across multiple dimensions with personalized suggestions for improvement.';
    } else {
      normalized.summary = parsed.summary.trim();
    }

    return { normalized, warnings: [] };
  }

  getDefaultDimensionName(module, index) {
    const defaultDimensions = {
      face: ['Facial Proportions', 'Skin Condition', 'Smile & Expression', 'Eyes & Aura', 'Overall Recognition'],
      figure: ['Posture Proportions', 'Line Sense', 'Pose Performance', 'Health Vibe', 'Clothing Fit'],
      outfit: ['Color Coordination', 'Item Selection', 'Layering', 'Fashionability', 'Personality Expression'],
      photography: ['Composition', 'Lighting Use', 'Clarity', 'Atmosphere', 'Creativity'],
      others: ['Personality & Charm', 'Cultural Vibe', 'Engagement', 'Emotion Expression', 'Social Shareability']
    };
    return defaultDimensions[module]?.[index] || `Dimension ${index + 1}`;
  }

  deriveSeed({ imageId, modules, mode }) {
    try {
      const normalizedModules = Array.isArray(modules)
        ? [...modules].sort().join('|')
        : 'default';
      const key = `${imageId || 'unknown'}::${mode || 'normal'}::${normalizedModules}`;
      const hash = crypto.createHash('sha256').update(key).digest();
      return hash.readUInt32BE(0);
    } catch (error) {
      logger.warn('Failed to derive scoring seed:', error);
      return undefined;
    }
  }

  // 提取显著特征（基于简单阈值 + 相对排名）
  extractDistinctiveTraits(features) {
    if (!features || typeof features !== 'object') return [];
    const traits = [];
    const push = (label, val) => { if (val !== undefined && Number(val) >= 8) traits.push(label); };
    try {
      // 针对 face
      if (features.face) {
        push('high facial symmetry', features.face.symmetry || features.face.Symmetry);
        push('clear skin quality', features.face.skinQuality || features.face.skin);
        push('expressive eyes', features.face.eyeContact || features.face.eyes);
      }
      if (features.figure) {
        push('confident posture', features.figure.posture);
        push('balanced body proportions', features.figure.proportions);
      }
      if (features.outfit) {
        push('strong color coordination', features.outfit.colorCoordination);
        push('well-fitted outfit', features.outfit.fit);
      }
      if (features.photography) {
        push('appealing composition', features.photography.composition);
        push('controlled lighting', features.photography.lighting);
        push('good focus sharpness', features.photography.focus);
      }
      if (features.overall) {
        push('authentic mood', features.overall.authenticity);
        push('visual uniqueness', features.overall.uniqueness);
      }
    } catch { /* ignore */ }

    // 去重
    const dedup = Array.from(new Set(traits));
    // 限制最多 6 个
    return dedup.slice(0, 6);
  }

  // 计算总分
  calculateTotalScore(radar) {
    const allScores = [];

    Object.values(radar).forEach(moduleScores => {
      if (Array.isArray(moduleScores)) {
        allScores.push(...moduleScores);
      }
    });

    if (allScores.length === 0) return 5.0;

    const sum = allScores.reduce((acc, score) => acc + score, 0);
    const average = sum / allScores.length;

    return Math.round(average * 10) / 10; // 保留一位小数
  }

  // 应用公平性调整
  applyFairnessAdjustments(response, diversityFlags) {
    if (!diversityFlags || diversityFlags.length === 0) {
      return response;
    }

    // 确保多样性特征得到积极反馈
    const adjusted = { ...response };

    // 添加多样性相关的积极评价
    if (diversityFlags.includes('african_features')) {
      adjusted.highlights = this.ensureDiversityHighlight(
        adjusted.highlights,
        'Your natural features radiate authentic beauty and confidence'
      );
    }

    if (diversityFlags.includes('latino_features')) {
      adjusted.highlights = this.ensureDiversityHighlight(
        adjusted.highlights,
        'Your vibrant style perfectly complements your natural warmth'
      );
    }

    if (diversityFlags.includes('asian_features')) {
      adjusted.highlights = this.ensureDiversityHighlight(
        adjusted.highlights,
        'Your elegant features create a harmonious and striking presence'
      );
    }

    return adjusted;
  }

  // 确保多样性高光
  ensureDiversityHighlight(highlights, newHighlight) {
    if (!Array.isArray(highlights) || highlights.length === 0) {
      return [newHighlight];
    }

    if (highlights.some(h => typeof h === 'string' && (h.toLowerCase().includes('natural') || h.toLowerCase().includes('authentic')))) {
      return highlights;
    }

    const cloned = [...highlights];
    cloned[0] = newHighlight;
    return cloned;
  }
}

export default new AIScoringService();