import { exec } from 'child_process';
import os from 'os';
import logger from '../config/logger.js';

function execShell(cmd, { allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
  exec(cmd, { windowsHide: true }, (error, stdout, _stderr) => {
      if (error && !allowFail) return reject(error);
      if (error && allowFail) return resolve(stdout.toString());
      resolve(stdout.toString());
    });
  });
}

async function findPidByPort(port) {
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      // 不使用管道交给 findstr 的退出码，直接过滤本地输出，避免“无结果”时被当成错误
      const out = await execShell('netstat -ano', { allowFail: true });
  const lines = out.split(/\r?\n/).filter(Boolean);
  const targetRegex = new RegExp(`:${port}(?:$|\\s)`);
      for (const line of lines) {
        if (!targetRegex.test(line)) continue;
        // 过滤 LISTEN / LISTENING 状态行
        if (!/LISTEN|LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) return parseInt(pid, 10);
      }
    } else {
      // Linux / macOS
      try {
        const out = await execShell(`lsof -i :${port} -sTCP:LISTEN -Pn`);
        const lines = out.split(/\n/).filter(l => l && !l.startsWith('COMMAND'));
        if (lines.length > 0) {
          const cols = lines[0].trim().split(/\s+/);
          const pid = cols[1];
          if (/^\d+$/.test(pid)) return parseInt(pid, 10);
        }
      } catch (e) {
        const out = await execShell(`fuser -n tcp ${port}`);
        const match = out.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    }
  } catch (e) {
    // 仅在非“未找到”情形下记录
    if (!/not found|No such process|denied/i.test(e.message)) {
      logger.warn(`findPidByPort failed for ${port}: ${e.message}`);
    }
  }
  return null;
}

async function killProcess(pid, gracefulMs = 800) {
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      // 直接强制结束（/T 级联，/F 强制）
      await execShell(`taskkill /PID ${pid} /T /F`, { allowFail: false });
    } else {
      process.kill(pid, 'SIGTERM');
      await new Promise(r => setTimeout(r, gracefulMs));
      try {
        process.kill(pid, 0);
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        /* noop - process already exited */
      }
    }
    return true;
  } catch (e) {
    logger.error(`Failed to kill PID ${pid}: ${e.message}`);
    return false;
  }
}

export async function ensurePortFree(port, options = {}) {
  const { autoKill = false, gracefulMs = 800 } = options;
  const pid = await findPidByPort(port);
  if (!pid) {
    return { freed: true, hadProcess: false };
  }
  if (!autoKill) {
    logger.warn(`Port ${port} is in use by PID ${pid}. autoKill disabled.`);
    return { freed: false, hadProcess: true, pid };
  }
  logger.warn(`Port ${port} occupied by PID ${pid}, attempting to terminate...`);
  const ok = await killProcess(pid, gracefulMs);
  if (!ok) return { freed: false, hadProcess: true, pid };
  // 再次确认
  const again = await findPidByPort(port);
  if (again) {
    logger.error(`Port ${port} still occupied after kill attempt (PID ${again}).`);
    return { freed: false, hadProcess: true, pid: again };
  }
  logger.info(`Port ${port} successfully freed.`);
  return { freed: true, hadProcess: true, pid };
}
