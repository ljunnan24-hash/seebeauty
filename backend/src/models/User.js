import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.oauth_sub;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  oauth_provider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  oauth_sub: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plan: {
    type: DataTypes.STRING,
    defaultValue: 'free',
    allowNull: false,
    validate: {
      isIn: [['free', 'pro', 'enterprise']]
    }
  },
  remaining_credits: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    allowNull: false,
    comment: 'Remaining usage credits (default 2 for new users)'
  },
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stripe Customer ID'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  profile: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      // Privacy & Data
      auto_delete: false,
      profile_visibility: 'public',
      allow_data_export: true,
      // Notifications
      email_notifications: true,
      marketing_emails: false,
      push_notifications: true,
      report_digest: 'weekly',
      // App Preferences
      share_default_mode: 'normal',
      theme: 'system'
    },
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.oauth_provider) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

export default User;