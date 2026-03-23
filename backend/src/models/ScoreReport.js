import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ScoreReport extends Model {}

ScoreReport.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  feature_set_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'feature_sets',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['normal', 'roast']]
    }
  },
  modules: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidModules(value) {
        const validModules = ['face', 'figure', 'outfit', 'photography', 'others'];
        if (!Array.isArray(value)) {
          throw new Error('Modules must be an array');
        }
        for (const module of value) {
          if (!validModules.includes(module)) {
            throw new Error(`Invalid module: ${module}`);
          }
        }
      }
    }
  },
  radar_json: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Radar chart data for each module'
  },
  highlights_json: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
    comment: 'Positive highlights'
  },
  improvements_json: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
    comment: 'Improvement suggestions'
  },
  module_details_json: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Detailed dimension-level objects per module (v2.0)',
    get() {
      const raw = this.getDataValue('module_details_json');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set(val) {
      if (val === null || val === undefined) {
        this.setDataValue('module_details_json', null);
      } else {
        this.setDataValue('module_details_json', JSON.stringify(val));
      }
    }
  },
  module_burns_json: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Roast mode one-line module burns (v2.0)',
    get() {
      const raw = this.getDataValue('module_burns_json');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set(val) {
      if (val === null || val === undefined) {
        this.setDataValue('module_burns_json', null);
      } else {
        this.setDataValue('module_burns_json', JSON.stringify(val));
      }
    }
  },
  total_score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  raw_output_ref: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raw AI output reference'
  },
  prompt_version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  processing_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  share_eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ScoreReport',
  tableName: 'score_reports',
  underscored: true,
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['mode']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default ScoreReport;