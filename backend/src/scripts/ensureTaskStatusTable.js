import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

export async function ensureTaskStatusTable() {
  try {
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name = 'task_statuses'"
    );

    if (Array.isArray(tables) && tables.length > 0) {
      return;
    }

    logger.warn('task_statuses table missing in current schema. Creating fallback table via ensureTaskStatusTable()');

    const queryInterface = sequelize.getQueryInterface();

    await queryInterface.createTable('task_statuses', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      image_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'image_assets',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      status: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      report_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'score_reports',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      error_code: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      data_json: {
        type: DataTypes.TEXT('long'),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('task_statuses', ['user_id']);
    await queryInterface.addIndex('task_statuses', ['status']);
    await queryInterface.addIndex('task_statuses', ['created_at']);

    logger.info('task_statuses table created successfully by ensureTaskStatusTable()');
  } catch (error) {
    logger.error('ensureTaskStatusTable failed:', error.message);
  }
}

export default ensureTaskStatusTable;
