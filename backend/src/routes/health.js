import express from 'express';
import modelResolver from '../config/modelResolver.js';
import { sequelize } from '../config/database.js';
import { ScoreReport } from '../models/index.js';

const router = express.Router();

router.get('/ai-config', async (req, res) => {
  try {
    // Detect extended columns
    const [rows] = await sequelize.query(
      "SELECT column_name FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'score_reports'"
    );
    const cols = new Set(rows.map(r => r.column_name));
    const extendedColumns = {
      module_details_json: cols.has('module_details_json'),
      module_burns_json: cols.has('module_burns_json')
    };

    // Basic stats
    const lastReport = await ScoreReport.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['prompt_version', 'created_at']
    });
    const totalReports = await ScoreReport.count();

    res.json({
      status: 'ok',
      promptVersionTarget: '2.1',
      lastReportPromptVersion: lastReport?.prompt_version || null,
      lastReportAt: lastReport?.created_at || null,
      totalReports,
      chatModel: modelResolver.getChatModel(),
      visionModel: modelResolver.getVisionModel(),
      extendedColumns,
      notes: [
        'normalizationWarnings currently only in-memory (not persisted)',
        'module_* columns stored as TEXT with JSON serialization'
      ]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;