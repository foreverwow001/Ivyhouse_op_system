'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '..');
const smokeUrl = 'http://127.0.0.1:3000/api/daily-ops/inventory-alerts/count-reminder';
const startupMarker = '[ivyhouse/api] runtime ready';
const timeoutMs = 30000;
const shutdownTimeoutMs = 5000;

async function main() {
  const child = spawn('npm', ['run', 'start:dev'], {
    cwd: apiRoot,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });

  let startupEvidenceLine = null;
  const outputLines = [];

  const rememberLine = (chunk) => {
    const text = chunk.toString();
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      outputLines.push(line);

      if (line.includes(startupMarker)) {
        startupEvidenceLine = line;
      }
    }
  };

  child.stdout.on('data', rememberLine);
  child.stderr.on('data', rememberLine);

  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`API 啟動逾時。最近輸出：${outputLines.slice(-12).join(' | ')}`));
    }, timeoutMs);

    child.once('exit', () => {
      clearTimeout(timer);
    });
  });

  try {
    await Promise.race([
      waitForStartup(() => startupEvidenceLine, outputLines, child),
      timeoutPromise,
    ]);

    const response = await fetch(smokeUrl);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `Smoke request 失敗: HTTP ${response.status} ${summarizePayload(payload)}`,
      );
    }

    if (!Array.isArray(payload)) {
      throw new Error(`Smoke request 回傳非陣列：${summarizePayload(payload)}`);
    }

    console.log(startupEvidenceLine);
    console.log(
      `[ivyhouse/api] smoke ok route=/api/daily-ops/inventory-alerts/count-reminder itemCount=${payload.length}`,
    );
  } finally {
    await terminateChild(child);
  }
}

async function waitForStartup(getStartupEvidenceLine, outputLines, child) {
  while (true) {
    const startupEvidenceLine = getStartupEvidenceLine();
    if (startupEvidenceLine) {
      return startupEvidenceLine;
    }

    if (child.exitCode !== null) {
      throw new Error(`API 提前結束。最近輸出：${outputLines.slice(-12).join(' | ')}`);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }
}

async function terminateChild(child) {
  if (child.exitCode !== null) {
    return;
  }

  sendSignal(child, 'SIGTERM');

  if (await onceExit(child, shutdownTimeoutMs)) {
    return;
  }

  sendSignal(child, 'SIGKILL');
  if (await onceExit(child, shutdownTimeoutMs)) {
    return;
  }

  throw new Error('API 子程序在 SIGKILL 後仍未退出。');
}

function sendSignal(child, signal) {
  if (child.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32' || !child.pid) {
    child.kill(signal);
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

function onceExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve(true);
      return;
    }

    const onExit = () => {
      cleanup();
      resolve(true);
    };

    const timer =
      typeof timeoutMs === 'number'
        ? setTimeout(() => {
            cleanup();
            resolve(false);
          }, timeoutMs)
        : null;

    const cleanup = () => {
      child.off('exit', onExit);
      if (timer) {
        clearTimeout(timer);
      }
    };

    child.once('exit', onExit);
  });
}

function summarizePayload(payload) {
  if (payload === null || payload === undefined) {
    return '(empty payload)';
  }

  if (Array.isArray(payload)) {
    return `array(length=${payload.length})`;
  }

  if (typeof payload === 'object' && payload && typeof payload.message === 'string') {
    return payload.message;
  }

  if (typeof payload === 'object' && payload) {
    return `object(keys=${Object.keys(payload).join(',') || 'none'})`;
  }

  return String(payload);
}

main().catch((error) => {
  console.error(`[ivyhouse/api] smoke failed ${error.message}`);
  process.exitCode = 1;
});