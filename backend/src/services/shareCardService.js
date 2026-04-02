import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import { ScoreReport, ImageAsset } from '../models/index.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ShareCardService {
  constructor() {
    this.cardWidth = 1200;
    this.cardHeight = 630; // Standard OG image size
    this.cache = new Map();
  }

  // 生成分享卡片（HTML/SVG版本）
  async generateShareCard(reportId) {
    try {
      // 检查缓存
      if (this.cache.has(reportId)) {
        return this.cache.get(reportId);
      }

      // 获取报告数据
      const report = await ScoreReport.findByPk(reportId, {
        include: [{
          model: ImageAsset,
          as: 'image'
        }]
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // 生成SVG分享卡片
      const svgContent = this.generateSVGCard(report);
      const fileName = `share-${reportId}-${Date.now()}.svg`;
      const filePath = await this.saveShareCard(svgContent, fileName);

      const result = {
        url: `/uploads/share-cards/${fileName}`,
        path: filePath,
        type: 'svg'
      };

      // 缓存结果（5分钟）
      this.cache.set(reportId, result);
      setTimeout(() => this.cache.delete(reportId), 5 * 60 * 1000);

      return result;
    } catch (error) {
      logger.error('Share card generation failed:', error);
      throw error;
    }
  }

  // 生成SVG卡片
  generateSVGCard(report) {
    const mode = report.mode;
  const rawScore = report.total_score;
  const numericScore = (rawScore === null || rawScore === undefined) ? null : parseFloat(rawScore);
  const score = Number.isFinite(numericScore) ? numericScore : null;
    const highlights = report.highlights_json || [];

    // 背景渐变色
    const gradientColors = mode === 'roast'
      ? ['#FB923C', '#DC2626']
      : ['#3B82F6', '#8B5CF6'];

    // 高亮内容
    let highlightTexts = '';
    highlights.slice(0, 3).forEach((highlight, index) => {
      const truncated = this.truncateText(String(highlight ?? ''), 50);
      const safeText = this.escapeXml(truncated);
      highlightTexts += `<text x="450" y="${450 + index * 30}" fill="rgba(255, 255, 255, 0.9)" font-size="18" font-family="Arial">• ${safeText}</text>`;
    });

    return `
      <svg width="${this.cardWidth}" height="${this.cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradientColors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${gradientColors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 背景 -->
        <rect width="100%" height="100%" fill="url(#bgGradient)" />
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.1)" />

        <!-- 标题 -->
        <text x="60" y="80" fill="#FFFFFF" font-size="48" font-weight="bold" font-family="Arial">SeeBeauty</text>
        <text x="60" y="120" fill="${mode === 'roast' ? '#FED7AA' : '#DBEAFE'}" font-size="24" font-family="Arial">
          ${mode === 'roast' ? '🔥 ROAST MODE' : '✨ NORMAL MODE'}
        </text>

        <!-- 分数圆圈 -->
        <circle cx="600" cy="265" r="100" fill="rgba(255, 255, 255, 0.2)" />
        <text x="600" y="280" fill="#FFFFFF" font-size="72" font-weight="bold" font-family="Arial" text-anchor="middle">
          ${score !== null ? score.toFixed(1) : 'N/A'}
        </text>
        <text x="600" y="315" fill="#FFFFFF" font-size="20" font-family="Arial" text-anchor="middle">Overall Score</text>

        <!-- 高亮标题 -->
        <text x="450" y="420" fill="#FFFFFF" font-size="24" font-weight="bold" font-family="Arial">
          ${mode === 'roast' ? 'Top Roasts:' : 'Highlights:'}
        </text>

        <!-- 高亮内容 -->
        ${highlightTexts}

        <!-- 页脚 -->
        <text x="600" y="600" fill="rgba(255, 255, 255, 0.6)" font-size="16" font-family="Arial" text-anchor="middle">
          Get your AI photo feedback at seebeauty.com
        </text>
      </svg>
    `;
  }

  // 截断文本
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // 保存分享卡片
  async saveShareCard(content, fileName) {
    const shareCardsDir = path.join(process.cwd(), 'uploads', 'share-cards');
    await fs.mkdir(shareCardsDir, { recursive: true });

    const filePath = path.join(shareCardsDir, fileName);
    await fs.writeFile(filePath, content, 'utf8');

    return filePath;
  }

  // 生成分享链接
  async generateShareLink(reportId) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5176';
    const shareToken = crypto.randomBytes(16).toString('hex');

    // TODO: 存储shareToken到数据库以验证

    return {
      url: `${baseUrl}/share/${reportId}?token=${shareToken}`,
      token: shareToken
    };
  }

  // 生成社交媒体元数据
  generateSocialMeta(report) {
  const numericScore = report.total_score == null ? null : parseFloat(report.total_score);
  const scoreText = Number.isFinite(numericScore) ? numericScore.toFixed(1) : 'N/A';
  const title = `My SeeBeauty Score: ${scoreText}/10`;
    const description = report.mode === 'roast'
      ? "I got roasted by AI! Check out what it said about my photo 🔥"
      : "I got my photo analyzed by AI! Check out my detailed feedback ✨";

    return {
      title,
      description,
      image: `/api/reports/${report.id}/share-card`,
      url: `/share/${report.id}`,
      twitter: {
        card: 'summary_large_image',
        site: '@seebeauty',
        creator: '@seebeauty'
      },
      og: {
        type: 'website',
        site_name: 'SeeBeauty'
      }
    };
  }
}

export default new ShareCardService();