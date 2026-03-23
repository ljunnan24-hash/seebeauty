import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TaskStatus extends Model {}

TaskStatus.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
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
    allowNull: true,
    get() {
      const raw = this.getDataValue('data_json');
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch (error) {
        return {};
      }
    },
    set(value) {
      if (value == null) {
        this.setDataValue('data_json', null);
      } else {
        this.setDataValue('data_json', JSON.stringify(value));
      }
    }
  }
}, {
  sequelize,
  modelName: 'TaskStatus',
  tableName: 'task_statuses',
  underscored: true,
  timestamps: true
});

export default TaskStatus;
