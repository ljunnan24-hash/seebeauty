import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class FeatureSet extends Model {}

FeatureSet.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  image_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'image_assets',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  feature_json: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Extracted features from vision API'
  },
  diversity_flags: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
    comment: 'Detected diversity characteristics'
  },
  extraction_method: {
    type: DataTypes.STRING,
    defaultValue: 'vision_api',
    allowNull: false
  },
  extraction_version: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'FeatureSet',
  tableName: 'feature_sets',
  underscored: true,
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['image_id']
    }
  ]
});

export default FeatureSet;