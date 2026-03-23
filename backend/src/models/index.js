import User from './User.js';
import AuthSession from './AuthSession.js';
import ImageAsset from './ImageAsset.js';
import FeatureSet from './FeatureSet.js';
import ScoreReport from './ScoreReport.js';
import TaskStatus from './TaskStatus.js';
import Payment from './Payment.js';
import Subscription from './Subscription.js';

// User associations
User.hasMany(AuthSession, {
  foreignKey: 'user_id',
  as: 'sessions'
});

User.hasMany(ImageAsset, {
  foreignKey: 'user_id',
  as: 'images'
});

User.hasMany(ScoreReport, {
  foreignKey: 'user_id',
  as: 'reports'
});

User.hasMany(TaskStatus, {
  foreignKey: 'user_id',
  as: 'tasks'
});

User.hasMany(Payment, {
  foreignKey: 'user_id',
  as: 'payments'
});

User.hasMany(Subscription, {
  foreignKey: 'user_id',
  as: 'subscriptions'
});

// AuthSession associations
AuthSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ImageAsset associations
ImageAsset.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

ImageAsset.hasOne(FeatureSet, {
  foreignKey: 'image_id',
  as: 'features'
});

ImageAsset.hasMany(ScoreReport, {
  foreignKey: 'image_id',
  as: 'reports'
});

ImageAsset.hasMany(TaskStatus, {
  foreignKey: 'image_id',
  as: 'tasks'
});

// FeatureSet associations
FeatureSet.belongsTo(ImageAsset, {
  foreignKey: 'image_id',
  as: 'image'
});

FeatureSet.hasMany(ScoreReport, {
  foreignKey: 'feature_set_id',
  as: 'reports'
});

// ScoreReport associations
ScoreReport.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

ScoreReport.belongsTo(ImageAsset, {
  foreignKey: 'image_id',
  as: 'image'
});

ScoreReport.belongsTo(FeatureSet, {
  foreignKey: 'feature_set_id',
  as: 'features'
});

TaskStatus.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

TaskStatus.belongsTo(ImageAsset, {
  foreignKey: 'image_id',
  as: 'image'
});

TaskStatus.belongsTo(ScoreReport, {
  foreignKey: 'report_id',
  as: 'report'
});

// Payment associations
Payment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Subscription associations
Subscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export {
  User,
  AuthSession,
  ImageAsset,
  FeatureSet,
  ScoreReport,
  TaskStatus,
  Payment,
  Subscription
};