import crypto from 'crypto';
import { ImageAsset, FeatureSet } from '../models/index.js';
import logger from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import modelResolver from '../config/modelResolver.js';
import llmRateLimiter from '../utils/llmRateLimiter.js';
import { createArkResponse, stripMarkdownJsonFence } from './arkResponsesClient.js';

class VisionService {
  constructor() {
    this.cache = new Map();
  }

  // 提取图片特征
  async extractFeatures(imageId) {
    try {
      // 检查缓存
      if (this.cache.has(imageId)) {
        return this.cache.get(imageId);
      }

      // 优先使用数据库中已存在的特征，保证重复评分输入一致
      const existingFeatureSet = await FeatureSet.findOne({
        where: { image_id: imageId },
        order: [['created_at', 'DESC']]
      });

      if (existingFeatureSet) {
        const cached = {
          data: existingFeatureSet.feature_json,
          diversityFlags: existingFeatureSet.diversity_flags || [],
          extractedAt: existingFeatureSet.createdAt?.toISOString?.() ?? new Date().toISOString(),
          featureSetId: existingFeatureSet.id,
          source: 'database'
        };

        this.cacheResult(imageId, cached);
        return cached;
      }

      const image = await ImageAsset.findByPk(imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      // 获取图片URL或本地路径
      const imageUrl = await this.getImageUrl(image);

      // 调用 Ark Responses API（多模态）提取特征
      const features = await this.callVisionAPI(imageUrl, imageId);

      // 检测多样性特征
      const diversityFlags = this.detectDiversityFeatures(features);

      const result = {
        data: features,
        diversityFlags,
        extractedAt: new Date().toISOString(),
        featureSetId: null,
        source: 'vision'
      };

      this.cacheResult(imageId, result);

      return result;
    } catch (error) {
      logger.error('Feature extraction failed:', error);
      throw error;
    }
  }

  // 调用视觉模型（火山方舟 Responses API）
  async callVisionAPI(imageUrl, imageId) {
    try {
      const systemInstruction = `You are a professional image analyzer. Extract detailed visual features from the image including:
              - Face: symmetry, skin quality, expression, facial structure, eye contact
              - Figure: posture, body language, proportions, fitness level
              - Outfit: style, color coordination, fit, appropriateness, accessories
              - Photography: lighting, composition, background, focus, color grading
              - Overall: mood, authenticity, visual appeal, uniqueness

              Return a structured JSON with scores (1-10) and descriptions for each category.`;

      const body = {
        model: modelResolver.getVisionModel(),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_image',
                image_url: imageUrl
              },
              {
                type: 'input_text',
                text: `${systemInstruction}\n\nAnalyze this image and provide detailed feature extraction. Respond with JSON only.`
              }
            ]
          }
        ]
      };

      const temperature = parseFloat(process.env.ARK_VISION_TEMPERATURE || '0', 10);
      if (!Number.isNaN(temperature)) {
        body.temperature = temperature;
      }
      const maxOut = parseInt(process.env.ARK_VISION_MAX_OUTPUT_TOKENS || '2048', 10);
      if (Number.isFinite(maxOut) && maxOut > 0) {
        body.max_output_tokens = maxOut;
      }

      const text = await llmRateLimiter.execute(
        () => createArkResponse(body),
        { label: 'vision:extract' }
      );

      // 尝试解析JSON响应
      try {
        return JSON.parse(stripMarkdownJsonFence(text));
      } catch (e) {
        // 如果不是JSON，使用默认结构
        return this.parseTextResponse(text);
      }
    } catch (error) {
      logger.error('Vision API call failed:', error);

      // 返回模拟数据（用于开发/测试）
      return this.getMockFeatures();
    }
  }

  cacheResult(imageId, payload) {
    this.cache.set(imageId, payload);
    setTimeout(() => this.cache.delete(imageId), 5 * 60 * 1000);
  }

  bindFeatureSetId(imageId, featureSetId) {
    if (!imageId || !featureSetId) return;
    const cached = this.cache.get(imageId);
    if (cached) {
      this.cache.set(imageId, { ...cached, featureSetId });
    }
  }

  deriveSeed(key) {
    if (!key) return undefined;
    try {
      const hash = crypto.createHash('sha256').update(String(key)).digest();
      return hash.readUInt32BE(0);
    } catch (error) {
      logger.warn('Failed to derive deterministic seed:', error);
      return undefined;
    }
  }

  // 解析文本响应
  parseTextResponse(_text) {
    // 简单的文本解析逻辑
    const features = {
      face: {
        symmetry: 7,
        skinQuality: 6,
        expression: 8,
        structure: 7,
        eyeContact: 8
      },
      figure: {
        posture: 7,
        bodyLanguage: 6,
        proportions: 7,
        fitnessLevel: 6
      },
      outfit: {
        style: 7,
        colorCoordination: 8,
        fit: 7,
        appropriateness: 8,
        accessories: 6
      },
      photography: {
        lighting: 6,
        composition: 7,
        background: 6,
        focus: 8,
        colorGrading: 7
      },
      overall: {
        mood: 7,
        authenticity: 8,
        visualAppeal: 7,
        uniqueness: 6
      }
    };

    return features;
  }

  // 检测多样性特征
  detectDiversityFeatures(features) {
    const flags = [];

    // 这里应该基于实际的特征检测逻辑
    // 示例简化实现
    if (features.face && features.face.skinTone) {
      const tone = features.face.skinTone;
      if (tone === 'dark' || tone === 'deep') {
        flags.push('african_features');
      } else if (tone === 'olive' || tone === 'tan') {
        flags.push('latino_features');
      } else if (tone === 'east_asian') {
        flags.push('asian_features');
      }
    }

    // 检测其他多样性特征
    if (features.overall && features.overall.culturalElements) {
      flags.push('cultural_expression');
    }

    return flags;
  }

  // 获取图片URL
  async getImageUrl(image) {
    // 如果是S3 URL，直接返回
    if (image.original_url.startsWith('http')) {
      return image.original_url;
    }

    // 如果是本地文件，转换为base64
    const imagePath = path.join(process.cwd(), image.original_url);
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = image.content_mime || 'image/jpeg';

    return `data:${mimeType};base64,${base64}`;
  }

  // 获取模拟特征（用于测试）
  getMockFeatures() {
    return {
      face: {
        symmetry: Math.floor(Math.random() * 3) + 6,
        skinQuality: Math.floor(Math.random() * 3) + 5,
        expression: Math.floor(Math.random() * 3) + 6,
        structure: Math.floor(Math.random() * 3) + 6,
        eyeContact: Math.floor(Math.random() * 3) + 7
      },
      figure: {
        posture: Math.floor(Math.random() * 3) + 6,
        bodyLanguage: Math.floor(Math.random() * 3) + 5,
        proportions: Math.floor(Math.random() * 3) + 6,
        fitnessLevel: Math.floor(Math.random() * 3) + 5
      },
      outfit: {
        style: Math.floor(Math.random() * 3) + 6,
        colorCoordination: Math.floor(Math.random() * 3) + 7,
        fit: Math.floor(Math.random() * 3) + 6,
        appropriateness: Math.floor(Math.random() * 3) + 7,
        accessories: Math.floor(Math.random() * 3) + 5
      },
      photography: {
        lighting: Math.floor(Math.random() * 3) + 5,
        composition: Math.floor(Math.random() * 3) + 6,
        background: Math.floor(Math.random() * 3) + 5,
        focus: Math.floor(Math.random() * 3) + 7,
        colorGrading: Math.floor(Math.random() * 3) + 6
      },
      overall: {
        mood: Math.floor(Math.random() * 3) + 6,
        authenticity: Math.floor(Math.random() * 3) + 7,
        visualAppeal: Math.floor(Math.random() * 3) + 6,
        uniqueness: Math.floor(Math.random() * 3) + 5
      }
    };
  }
}

export default new VisionService();
