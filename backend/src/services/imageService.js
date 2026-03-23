import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { ImageAsset } from '../models/index.js';
import logger from '../config/logger.js';

// 配置S3客户端（如果有AWS配置）
const s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}) : null;

// 本地存储配置（开发环境）
const localStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// S3存储配置
const s3Storage = s3Client ? multerS3({
  s3: s3Client,
  bucket: process.env.S3_BUCKET_NAME,
  acl: 'private',
  metadata: (req, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      userId: req.userId
    });
  },
  key: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `uploads/${req.userId}/${uniqueSuffix}${ext}`);
  }
}) : null;

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpeg,jpg,png,webp').split(',');
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimeType = file.mimetype.split('/')[1];

  if (allowedTypes.includes(ext) || allowedTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// 创建multer实例
export const upload = multer({
  storage: s3Storage || localStorage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024
  }
});

// 图片处理服务
class ImageService {
  // 处理上传的图片
  async processUploadedImage(file, userId) {
    try {
      const imageBuffer = file.buffer || await fs.readFile(file.path);

      // 获取图片元数据
      const metadata = await sharp(imageBuffer).metadata();

      // 生成感知哈希（简化版）
      const phash = await this.generatePerceptualHash(imageBuffer);

      // 检查重复图片
      const existingImage = await ImageAsset.findOne({
        where: {
          hash_phash: phash,
          user_id: userId,
          status: 'stored'
        }
      });

      if (existingImage) {
        // 检查现有图片文件是否还存在
        if (existingImage.original_url.startsWith('/uploads/')) {
          const originalFilePath = path.join(process.cwd(), existingImage.original_url.replace(/^\//, ''));
          try {
            await fs.access(originalFilePath);
            // 文件存在，可以安全删除当前上传的重复文件
            if (file.path) {
              await fs.unlink(file.path).catch(err =>
                logger.error('Failed to delete duplicate file:', err)
              );
            }
          } catch {
            // 原文件不存在，保留当前上传的文件
            logger.warn(`Original file missing for existing image ${existingImage.id}, keeping new upload`);
            // 不删除当前文件，并更新数据库中的URL
            if (file.path) {
              const newUrl = `/uploads/images/${file.filename}`;
              await existingImage.update({ original_url: newUrl });
            }
          }
        } else {
          // S3文件，删除本地临时文件
          if (file.path) {
            await fs.unlink(file.path).catch(err =>
              logger.error('Failed to delete duplicate file:', err)
            );
          }
        }

        logger.info(`Reusing existing image asset ${existingImage.id} for user ${userId}`);

        return {
          duplicate: false,
          image: existingImage,
          reused: true
        };
      }

      // 生成缩略图
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // 保存缩略图
      const thumbnailPath = await this.saveThumbnail(thumbnailBuffer, file.filename || file.key);

      // 创建数据库记录
      const imageAsset = await ImageAsset.create({
        user_id: userId,
        original_url: file.location || `/uploads/images/${file.filename}`,
        thumbnail_url: thumbnailPath,
        hash_phash: phash,
        status: 'processing',
        content_mime: file.mimetype,
        size_bytes: file.size,
        width: metadata.width,
        height: metadata.height,
        metadata: {
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha
        }
      });

      return {
        duplicate: false,
        image: imageAsset
      };
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw error;
    }
  }

  // 生成感知哈希（简化实现）
  async generatePerceptualHash(buffer) {
    try {
      // 缩小图片到8x8并转为灰度
      const data = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();

      // 计算平均值
      const pixels = Array.from(data);
      const avg = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

      // 生成哈希
      let hash = '';
      for (let i = 0; i < pixels.length; i++) {
        hash += pixels[i] > avg ? '1' : '0';
      }

      // 转换为16进制
      return parseInt(hash, 2).toString(16).padStart(16, '0');
    } catch (error) {
      logger.error('Failed to generate perceptual hash:', error);
      return crypto.randomBytes(8).toString('hex');
    }
  }

  // 保存缩略图
  async saveThumbnail(buffer, originalFilename) {
    const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });

    const thumbnailFilename = `thumb-${originalFilename}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    await fs.writeFile(thumbnailPath, buffer);

    return `/uploads/thumbnails/${thumbnailFilename}`;
  }

  // 内容审核（占位）
  async moderateImage(imageId) {
    try {
      const image = await ImageAsset.findByPk(imageId);
      if (!image) throw new Error('Image not found');

      // TODO: 集成实际的内容审核API
      // 这里是模拟的审核结果
      const moderationResult = {
        safe: true,
        adult: 0.01,
        violence: 0.001,
        racy: 0.02
      };

      await image.update({
        safe_flags: moderationResult,
        status: moderationResult.safe ? 'stored' : 'flagged'
      });

      return moderationResult;
    } catch (error) {
      logger.error('Image moderation failed:', error);
      throw error;
    }
  }

  // 删除图片
  async deleteImage(imageId, userId) {
    try {
      const image = await ImageAsset.findOne({
        where: { id: imageId, user_id: userId }
      });

      if (!image) {
        throw new Error('Image not found');
      }

      // 软删除
      await image.update({
        status: 'deleted',
        deleted_at: new Date()
      });

      // TODO: 实际删除S3或本地文件（可选）

      return true;
    } catch (error) {
      logger.error('Image deletion failed:', error);
      throw error;
    }
  }
}

export default new ImageService();