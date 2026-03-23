import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Payment extends Model {
  toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Payment.init({
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
  stripe_payment_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Stripe PaymentIntent ID'
  },
  stripe_session_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stripe Checkout Session ID'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Payment amount'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'usd',
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('one_time', 'subscription'),
    allowNull: false,
    comment: 'Payment type: one-time or subscription'
  },
  status: {
    type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Payment status'
  },
  credits_added: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Credits added in this payment'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata'
  }
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  underscored: true,
  timestamps: true
});

export default Payment;

