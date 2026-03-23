import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Subscription extends Model {
  toJSON() {
    const values = { ...this.get() };
    return values;
  }

  // 检查订阅是否有效
  isActive() {
    return ['active', 'trialing'].includes(this.status);
  }

  // 检查订阅是否即将到期
  isExpiring() {
    if (!this.current_period_end) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(this.current_period_end) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }
}

Subscription.init({
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
    }
  },
  stripe_subscription_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Stripe Subscription ID'
  },
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Stripe Customer ID'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Subscription status: active, canceled, past_due, etc.'
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Current billing period start time'
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Current billing period end time'
  },
  cancel_at_period_end: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Cancel at period end'
  }
}, {
  sequelize,
  modelName: 'Subscription',
  tableName: 'subscriptions',
  underscored: true,
  timestamps: true
});

export default Subscription;

