import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { sequelize } from '../config/database.js';
import '../models/index.js'; // 导入所有模型以建立关联

dotenv.config();

async function createDatabase() {
  try {
    // 创建连接（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    const dbName = process.env.DB_NAME || 'seebeauty';

    // 创建数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error);
    throw error;
  }
}

async function syncModels(force = false) {
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 同步模型
    if (force) {
      console.log('⚠️  Dropping all tables and recreating...');
      await sequelize.sync({ force: true });
    } else {
      console.log('🔄 Syncing models (alter mode)...');
      await sequelize.sync({ alter: true });
    }

    console.log('✅ All models synchronized successfully');
  } catch (error) {
    console.error('❌ Failed to sync models:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('📊 Creating additional indexes...');

    const queries = [
      // 用户邮箱唯一索引
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);',

      // 会话索引
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);',

      // 图片资产索引
      'CREATE INDEX IF NOT EXISTS idx_image_assets_user_id ON image_assets(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_hash ON image_assets(hash_phash);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_status ON image_assets(status);',

      // 评分报告索引
      'CREATE INDEX IF NOT EXISTS idx_score_reports_user_id ON score_reports(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_score_reports_mode ON score_reports(mode);',
      'CREATE INDEX IF NOT EXISTS idx_score_reports_created ON score_reports(created_at);'
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
      } catch (err) {
        console.warn(`⚠️  Index might already exist: ${err.message}`);
      }
    }

    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
    throw error;
  }
}

async function seedInitialData() {
  try {
    console.log('🌱 Seeding initial data...');

    // 创建测试用户（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      const { User } = await import('../models/index.js');

      const testUser = await User.findOrCreate({
        where: { email: 'test@example.com' },
        defaults: {
          email: 'test@example.com',
          password_hash: 'Test123!', // 会被自动hash
          plan: 'free',
          is_active: true,
          profile: {
            name: 'Test User'
          }
        }
      });

      if (testUser[1]) {
        console.log('✅ Test user created: test@example.com / Test123!');
      } else {
        console.log('ℹ️  Test user already exists');
      }
    }

    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed data:', error);
    // 不抛出错误，种子数据失败不应阻止初始化
  }
}

async function main() {
  console.log('🚀 Starting database initialization...\n');

  const args = process.argv.slice(2);
  const force = args.includes('--force');

  if (force) {
    console.log('⚠️  WARNING: Force mode enabled. All data will be lost!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // 1. 创建数据库
    await createDatabase();

    // 2. 同步模型
    await syncModels(force);

    // 3. 创建索引
    await createIndexes();

    // 4. 种子数据
    if (force || args.includes('--seed')) {
      await seedInitialData();
    }

    console.log('\n✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// 运行主函数
main();