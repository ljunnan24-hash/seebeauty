import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ImageAsset extends Model {}

ImageAsset.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  original_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumbnail_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hash_phash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'stored',
    allowNull: false,
    validate: {
      isIn: [['stored', 'deleted', 'flagged', 'processing']]
    }
  },
  content_mime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  safe_flags: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: true,
    comment: 'Content moderation results'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: true,
    comment: 'EXIF and other metadata'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ImageAsset',
  tableName: 'image_assets',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['hash_phash']
    },
    {
      fields: ['status']
    }
  ]
});

export default ImageAsset;