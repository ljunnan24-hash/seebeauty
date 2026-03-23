import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

const REQUIRED_COLUMNS = [
  { name: 'module_details_json', ddlJson: 'ADD COLUMN `module_details_json` JSON NULL COMMENT "Detailed dimension-level objects per module (v2.0)"', ddlText: 'ADD COLUMN `module_details_json` LONGTEXT NULL COMMENT "Detailed dimension-level objects per module (v2.0) (TEXT fallback)"' },
  { name: 'module_burns_json', ddlJson: 'ADD COLUMN `module_burns_json` JSON NULL COMMENT "Roast mode one-line module burns (v2.0)"', ddlText: 'ADD COLUMN `module_burns_json` LONGTEXT NULL COMMENT "Roast mode one-line module burns (v2.0) (TEXT fallback)"' }
];

export async function ensureScoreReportColumns() {
  try {
    const fetchExisting = async () => {
      const [rows] = await sequelize.query(
        "SELECT column_name FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'score_reports'"
      );
      return new Set(rows.map(r => r.column_name));
    };

    let existing = await fetchExisting();
    // 调试打印一次现有列（debug 级别）
    logger.debug('score_reports existing columns:', Array.from(existing).join(', '));
    for (const col of REQUIRED_COLUMNS) {
      if (existing.has(col.name)) continue;
      try {
        logger.info(`Adding missing column score_reports.${col.name} (JSON)`);
        await sequelize.query(`ALTER TABLE score_reports ${col.ddlJson}`);
        logger.info(`Added column ${col.name} as JSON`);
      } catch (eJson) {
        const msg = eJson?.message || String(eJson);
        if (/Duplicate column name/i.test(msg)) {
          logger.info(`Column ${col.name} already exists (detected during JSON add). Marking as present.`);
          existing.add(col.name);
          continue; // 不再尝试 fallback
        }
        logger.error(`Failed adding column ${col.name} as JSON:`, msg);
        // 尝试 TEXT 回退
        try {
          logger.info(`Retry adding column score_reports.${col.name} as LONGTEXT fallback`);
            await sequelize.query(`ALTER TABLE score_reports ${col.ddlText}`);
          logger.info(`Added column ${col.name} as LONGTEXT fallback`);
        } catch (eText) {
          const tmsg = eText?.message || String(eText);
            if (/Duplicate column name/i.test(tmsg)) {
              logger.info(`Column ${col.name} already exists (detected during LONGTEXT fallback). Marking as present.`);
              existing.add(col.name);
            } else {
              logger.error(`Failed adding column ${col.name} as LONGTEXT fallback:`, tmsg);
            }
        }
      }
      // 刷新列集合
      existing = await fetchExisting();
    }
  } catch (err) {
    logger.error('ensureScoreReportColumns check failed:', err.message);
  }
}

export default ensureScoreReportColumns;