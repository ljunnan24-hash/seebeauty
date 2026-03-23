import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Migration script: Add payment-related tables and columns
 * Includes: payments table, subscriptions table, and new fields to users table
 */
async function addPaymentTables() {
  try {
    logger.info('Starting to add payment related tables and columns...');

    // 1. Add new fields to users table
    logger.info('Checking and adding new columns to users table...');
    
    // Helper function to check if a column exists
    const columnExists = async (tableName, columnName) => {
      const [rows] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = '${columnName}'
      `);
      return rows[0].count > 0;
    };

    // Add remaining_credits column
    const hasRemainingCredits = await columnExists('users', 'remaining_credits');
    if (!hasRemainingCredits) {
      logger.info('Adding remaining_credits column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN remaining_credits INT DEFAULT 2 
        COMMENT 'Remaining usage credits (default 2 for new users)'
      `);
      logger.info('remaining_credits column added successfully');
    } else {
      logger.info('remaining_credits column already exists, skipping');
    }

    // Add stripe_customer_id column
    const hasStripeCustomerId = await columnExists('users', 'stripe_customer_id');
    if (!hasStripeCustomerId) {
      logger.info('Adding stripe_customer_id column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL 
        COMMENT 'Stripe Customer ID'
      `);
      logger.info('stripe_customer_id column added successfully');
    } else {
      logger.info('stripe_customer_id column already exists, skipping');
    }

    logger.info('All users table columns checked and added.');

    // 2. Create payments table
    logger.info('Creating payments table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        stripe_payment_id VARCHAR(255) NOT NULL,
        stripe_session_id VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'usd',
        type ENUM('one_time', 'subscription') NOT NULL,
        status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending',
        credits_added INT DEFAULT 0,
        metadata JSON DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_payments_user (user_id),
        INDEX idx_payments_stripe_payment (stripe_payment_id),
        INDEX idx_payments_stripe_session (stripe_session_id),
        INDEX idx_payments_status (status),
        INDEX idx_payments_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Payment records table'
    `);
    logger.info('payments table created successfully');

    // 3. Create subscriptions table
    logger.info('Creating subscriptions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
        stripe_customer_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_period_start DATETIME DEFAULT NULL,
        current_period_end DATETIME DEFAULT NULL,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_subscriptions_user (user_id),
        INDEX idx_subscriptions_stripe_sub (stripe_subscription_id),
        INDEX idx_subscriptions_stripe_customer (stripe_customer_id),
        INDEX idx_subscriptions_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Subscription records table'
    `);
    logger.info('subscriptions table created successfully');

    logger.info('All payment-related tables and columns have been added successfully!');
    return true;
  } catch (error) {
    logger.error('Failed to add payment related tables and columns:', error);
    throw error;
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addPaymentTables()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addPaymentTables };

