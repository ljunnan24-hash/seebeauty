import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

async function fixUserAgentColumn() {
  try {
    logger.info('Checking and fixing user_agent column length...');

    // 检查当前字段定义
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'seebeauty'}'
      AND TABLE_NAME = 'auth_sessions'
      AND COLUMN_NAME = 'user_agent'
    `);

    if (results.length > 0) {
      const currentLength = results[0].CHARACTER_MAXIMUM_LENGTH;
      logger.info(`Current user_agent column length: ${currentLength}`);

      if (currentLength < 1000) {
        logger.info('Updating user_agent column to VARCHAR(1000)...');

        await sequelize.query(`
          ALTER TABLE auth_sessions
          MODIFY COLUMN user_agent VARCHAR(1000)
        `);

        logger.info('✅ user_agent column updated successfully');
      } else {
        logger.info('✅ user_agent column length is already sufficient');
      }
    } else {
      logger.warn('⚠️ user_agent column not found in auth_sessions table');
    }

    // 验证修改结果
    const [updatedResults] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'seebeauty'}'
      AND TABLE_NAME = 'auth_sessions'
      AND COLUMN_NAME = 'user_agent'
    `);

    if (updatedResults.length > 0) {
      logger.info(`Final user_agent column length: ${updatedResults[0].CHARACTER_MAXIMUM_LENGTH}`);
    }

  } catch (error) {
    logger.error('Failed to fix user_agent column:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  fixUserAgentColumn()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

export { fixUserAgentColumn };