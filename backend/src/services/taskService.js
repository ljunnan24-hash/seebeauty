import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { ScoreReport, ImageAsset, FeatureSet, TaskStatus } from '../models/index.js';
import visionService from './visionService.js';
import aiScoringService from './aiScoringService.js';
import logger from '../config/logger.js';

// 任务状态存储（内存模式）
const taskStatus = new Map();
const NON_TERMINAL_STATUSES = ['pending', 'extracting_features', 'generating_score', 'saving_report'];

class TaskService {
  constructor() {
    logger.info('TaskService initialized with persistent status tracking');
    setImmediate(() => {
      this.initializePersistence().catch(error => {
        logger.error('Failed to initialize task persistence:', error);
      });
    });
  }

  async initializePersistence() {
    try {
      const [affected] = await TaskStatus.update({
        status: 'failed',
        error_code: 'TASK_INTERRUPTED',
        error_message: 'Task was interrupted due to service restart. Please resubmit.'
      }, {
        where: {
          status: {
            [Op.in]: NON_TERMINAL_STATUSES
          }
        }
      });

      if (affected > 0) {
        logger.warn(`Marked ${affected} in-flight task(s) as failed during service restart`);
      }
    } catch (error) {
      logger.error('TaskService persistence initialization failed:', error);
    }
  }

  // 创建评分任务
  async createRatingTask({ userId, imageId, modules, mode, userDescription }) {
    const taskId = uuidv4();

    try {
      logger.info(`Creating rating task ${taskId} for user ${userId}`);

      // 初始化任务状态
      // Normalize modules here as a secondary safeguard
      let normModules = modules;
      if (!Array.isArray(normModules)) {
        if (typeof normModules === 'string') {
          try { normModules = JSON.parse(normModules); } catch { normModules = [normModules]; }
        } else {
          normModules = ['face'];
        }
      }
      if (normModules.length === 0) normModules = ['face'];

      await TaskStatus.create({
        id: taskId,
        user_id: userId,
        image_id: imageId,
        status: 'pending',
        data_json: {
          imageId,
          modules: normModules,
          mode,
          userId,
          userDescription
        }
      });

      await this.updateTaskStatus(taskId, 'pending', {
        imageId,
        modules: normModules,
        mode,
        userId,
        userDescription
      });

      // 异步处理任务
      this.processTask({
        taskId,
        userId,
        imageId,
        modules: normModules,
        mode,
        userDescription
      }).catch(async error => {
        logger.error(`Task ${taskId} failed:`, error);
        await this.updateTaskStatus(taskId, 'failed', {
          errorCode: error.cause?.message || error.code || 'TASK_FAILED',
          errorMessage: error.message
        });
      });

      return {
        id: taskId,
        status: 'pending'
      };
    } catch (error) {
      logger.error('Failed to create rating task:', error);
      throw error;
    }
  }

  // 处理任务
  async processTask({ taskId, userId, imageId, modules, mode, userDescription }) {
    const startTime = Date.now();

    try {
      await this.updateTaskStatus(taskId, 'extracting_features');
      logger.info(`Task ${taskId}: Extracting features for image ${imageId}`);

      // 1. 提取图片特征
      const features = await visionService.extractFeatures(imageId);
      const diversityFlags = Array.isArray(features.diversityFlags) ? features.diversityFlags : [];

      let featureSetId = features.featureSetId || null;
      if (!featureSetId) {
        const createdFeatureSet = await FeatureSet.create({
          image_id: imageId,
          feature_json: features.data,
          diversity_flags: diversityFlags,
          extraction_method: 'vision_api',
          extraction_version: '1.0'
        });
        featureSetId = createdFeatureSet.id;
        visionService.bindFeatureSetId(imageId, featureSetId);
      }

      await this.updateTaskStatus(taskId, 'generating_score');
      logger.info(`Task ${taskId}: Generating AI score`);

      // 2. 生成AI评分
      const scoringResult = await aiScoringService.generateScore({
        imageId,
        features: features.data,
        diversityFlags,
        modules,
        mode,
        userDescription
      });

      await this.updateTaskStatus(taskId, 'saving_report');
      logger.info(`Task ${taskId}: Saving report`);

      // 3. 保存评分报告
      // 动态检测列（避免列未成功创建时写入报错）
      const [cols] = await ScoreReport.sequelize.query(
        "SELECT column_name FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'score_reports'"
      );
      const existingCols = new Set(cols.map(c => c.column_name));

      const basePayload = {
        user_id: userId,
        image_id: imageId,
        feature_set_id: featureSetId,
        mode,
        modules,
        radar_json: scoringResult.radar,
        highlights_json: scoringResult.evaluation || scoringResult.highlights,
        improvements_json: scoringResult.recommendations || scoringResult.improvements,
        total_score: scoringResult.totalScore,
        raw_output_ref: scoringResult.rawOutput,
        prompt_version: scoringResult.promptVersion,
        processing_time_ms: Date.now() - startTime,
        share_eligible: true
      };

      if (existingCols.has('module_details_json')) {
        basePayload.module_details_json = scoringResult.modules || null;
      }
      if (existingCols.has('module_burns_json')) {
        basePayload.module_burns_json = scoringResult.moduleBurns || null;
      }

      const report = await ScoreReport.create(basePayload);

      // 4. 更新图片状态
      await ImageAsset.update(
        { status: 'stored' },
        { where: { id: imageId } }
      );

      await this.updateTaskStatus(taskId, 'completed', { reportId: report.id });
      logger.info(`Task ${taskId}: Completed successfully, report ${report.id}`);

      return { success: true, reportId: report.id };
    } catch (error) {
      logger.error(`Task ${taskId} processing failed:`, error);
      await this.updateTaskStatus(taskId, 'failed', {
        errorCode: error.cause?.message || error.code || 'TASK_FAILED',
        errorMessage: error.message
      });
      throw error;
    }
  }

  // 获取任务状态
  async getTaskStatus(taskId) {
    if (taskStatus.has(taskId)) {
      return taskStatus.get(taskId);
    }

    const record = await TaskStatus.findByPk(taskId);
    if (!record) {
      return null;
    }

    const payload = this.transformRecordToPayload(record);
    taskStatus.set(taskId, payload);
    return payload;
  }

  // 更新任务状态
  async updateTaskStatus(taskId, status, data = {}) {
    const previous = taskStatus.get(taskId) || {};
    const preserved = { ...previous };
    delete preserved.taskId;
    delete preserved.status;
    delete preserved.updatedAt;

    const statusData = {
      taskId,
      status,
      ...preserved,
      ...data,
      updatedAt: new Date().toISOString()
    };

    taskStatus.set(taskId, statusData);

    const {
      reportId = null,
      errorCode = null,
      errorMessage = null,
      ...meta
    } = statusData;

    const metadataToPersist = { ...meta };
    delete metadataToPersist.taskId;
    delete metadataToPersist.status;
    delete metadataToPersist.updatedAt;

    const sanitizedMetadata = Object.fromEntries(
      Object.entries(metadataToPersist).filter(([, value]) => value !== undefined)
    );

    const userIdValue = statusData.userId ?? null;
    const imageIdValue = statusData.imageId ?? null;

    try {
      const [updatedCount] = await TaskStatus.update({
        status,
        report_id: reportId ?? null,
        error_code: errorCode ?? null,
        error_message: errorMessage ?? null,
        data_json: Object.keys(sanitizedMetadata).length ? JSON.stringify(sanitizedMetadata) : null
      }, {
        where: { id: taskId }
      });

      if (updatedCount === 0) {
        await TaskStatus.create({
          id: taskId,
          user_id: userIdValue,
          image_id: imageIdValue,
          status,
          report_id: reportId ?? null,
          error_code: errorCode ?? null,
          error_message: errorMessage ?? null,
          data_json: Object.keys(sanitizedMetadata).length ? sanitizedMetadata : null
        });
      }
    } catch (error) {
      logger.error(`Failed to persist task status ${taskId}:`, error);
    }

    // 设置过期时间（1小时后清理）
    setTimeout(() => {
      taskStatus.delete(taskId);
    }, 60 * 60 * 1000);

    logger.debug(`Task ${taskId} status updated: ${status}`);
    return statusData;
  }

  transformRecordToPayload(record) {
    const meta = record.data_json || {};
    const payload = {
      taskId: record.id,
      status: record.status,
      ...meta,
      updatedAt: (record.updatedAt || record.createdAt)?.toISOString?.() ?? new Date().toISOString()
    };

    if (record.report_id) {
      payload.reportId = record.report_id;
    }
    if (record.error_code) {
      payload.errorCode = record.error_code;
    }
    if (record.error_message) {
      payload.errorMessage = record.error_message;
    }

    return payload;
  }

  // 取消任务
  async cancelTask(taskId) {
    const existing = await this.getTaskStatus(taskId);
    if (!existing) {
      return false;
    }

    await this.updateTaskStatus(taskId, 'cancelled');
    return true;
  }

  // 获取队列统计
  async getQueueStats() {
    const tasks = Array.from(taskStatus.values());
    const stats = {
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => ['extracting_features', 'generating_score', 'saving_report'].includes(t.status)).length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };

    stats.total = stats.pending + stats.processing + stats.completed + stats.failed + stats.cancelled;

    return stats;
  }

  // 清理过期任务
  cleanupExpiredTasks() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [taskId, task] of taskStatus.entries()) {
      const taskTime = new Date(task.updatedAt).getTime();
      if (now - taskTime > oneHour) {
        taskStatus.delete(taskId);
        logger.debug(`Cleaned up expired task: ${taskId}`);
      }
    }
  }
}

export default new TaskService();