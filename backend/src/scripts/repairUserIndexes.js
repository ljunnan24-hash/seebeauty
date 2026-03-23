import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/*
 * This script inspects the `users` table and removes redundant/duplicate indexes
 * that may have accumulated due to repeated `sync({ alter: true })` operations
 * (which in some Sequelize/MySQL versions could generate duplicate temp indexes
 * when constraints are altered many times). MySQL has a hard limit of 64 indexes
 * per table; exceeding it causes "Too many keys specified" during further ALTERs.
 */
async function repairUserIndexes() {
  const table = 'users';
  try {
    const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
    // Group by Column_name to find duplicates of single-column unique index on email, etc.
    const byKeyName = indexes.reduce((map, row) => {
      map[row.Key_name] = map[row.Key_name] || [];
      map[row.Key_name].push(row);
      return map;
    }, {});

    // Retain primary key and the first occurrence of 'email' unique, drop extra synthetic ones
    const dropCandidates = [];
    for (const [key, rows] of Object.entries(byKeyName)) {
      if (key === 'PRIMARY') continue;
      // Keep one index for each name; if Sequelize produced auto names like users_email_unique_1 etc
      if (rows.length > 0) {
        // If key name pattern indicates auto duplication (e.g., ends with incremental suffix) mark extras
        const lower = key.toLowerCase();
        if (lower.includes('email') && rows.length > 1) {
          // Keep the shortest key name; drop others
          const sorted = rows.sort((a,b)=>a.Key_name.length - b.Key_name.length);
          for (let i = 1; i < sorted.length; i++) {
            dropCandidates.push(sorted[i].Key_name);
          }
        }
      }
    }

    // Also detect identical definitions (same Column_name, Non_unique) but different Key_name
    const seenSignature = new Map();
    for (const row of indexes) {
      if (row.Key_name === 'PRIMARY') continue;
      const signature = `${row.Column_name}|${row.Seq_in_index}|${row.Non_unique}`;
      if (seenSignature.has(signature)) {
        if (!dropCandidates.includes(row.Key_name)) {
          dropCandidates.push(row.Key_name);
        }
      } else {
        seenSignature.set(signature, row.Key_name);
      }
    }

    const uniqueDrop = [...new Set(dropCandidates)];
    if (!uniqueDrop.length) {
      logger.info('No duplicate user indexes detected.');
      return;
    }

    logger.warn(`Dropping ${uniqueDrop.length} redundant index(es): ${uniqueDrop.join(', ')}`);
    for (const keyName of uniqueDrop) {
      try {
        await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${keyName}\``);
        logger.info(`Dropped index ${keyName}`);
      } catch (err) {
        logger.error(`Failed to drop index ${keyName}:`, err.message);
      }
    }

    logger.info('User index repair complete.');
  } catch (err) {
    logger.error('Index inspection failed:', err);
  } finally {
    await sequelize.close();
  }
}

repairUserIndexes();
