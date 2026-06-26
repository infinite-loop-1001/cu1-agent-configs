#!/usr/bin/env node
/**
 * lean-code: diff-capture
 * Hook: PostToolUse (matcher: Write|Edit|MultiEdit)
 *
 * After Claude writes/edits a file, computes the actual diff,
 * counts changed vs unchanged lines, and logs real token savings.
 * Accumulates session-wide savings stats.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const STATE_DIR = path.join(os.tmpdir(), 'lean-code');
const SAVINGS_FILE = path.join(STATE_DIR, 'diff-savings.json');

function loadSavings() {
  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    if (fs.existsSync(SAVINGS_FILE)) return JSON.parse(fs.readFileSync(SAVINGS_FILE, 'utf8'));
  } catch (_) {}
  return { totalFileTokens: 0, totalDiffTokens: 0, editCount: 0 };
}

function saveSavings(s) {
  try { fs.writeFileSync(SAVINGS_FILE, JSON.stringify(s)); } catch (_) {}
}

function countTokens(text) {
  return Math.ceil((text || '').length / 4);
}

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw); } catch (_) {}

  const filePath = input.tool_input?.file_path || input.filePath || input.path || '';

  if (!filePath || !fs.existsSync(filePath)) {
    process.stdout.write(JSON.stringify(input));
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileTokens = countTokens(fileContent);

    let diffOutput = '';
    try {
      diffOutput = execSync(`git diff HEAD -- "${filePath}" 2>/dev/null || git diff -- "${filePath}" 2>/dev/null`, {
        encoding: 'utf8',
        cwd: path.dirname(filePath),
        timeout: 3000,
      });
    } catch (_) {
      // Not a git repo or git not available
      diffOutput = '';
    }

    const diffTokens = countTokens(diffOutput);
    const savings = loadSavings();
    savings.totalFileTokens += fileTokens;
    savings.totalDiffTokens += diffTokens > 0 ? diffTokens : Math.ceil(fileTokens * 0.2);
    savings.editCount += 1;
    saveSavings(savings);

    if (diffTokens > 0 && fileTokens > 50) {
      const savedPct = Math.round((1 - diffTokens / fileTokens) * 100);
      if (savedPct > 20) {
        process.stderr.write(
          `[lean-code/diff-only] ${path.basename(filePath)}: diff=${diffTokens} tokens vs full=${fileTokens} tokens. ` +
          `Saved ${savedPct}% if diff-only mode was used. Use /diff-only to enforce.\n`
        );
      }
    }

    const total = savings.totalFileTokens;
    const totalDiff = savings.totalDiffTokens;
    if (savings.editCount > 0 && savings.editCount % 5 === 0) {
      const sessionSaved = total - totalDiff;
      process.stderr.write(
        `[lean-code] Session stats: ${savings.editCount} edits. ` +
        `With /diff-only you'd have saved ~${Math.round(sessionSaved / 1000 * 10) / 10}k tokens so far.\n`
      );
    }
  } catch (_) {}

  process.stdout.write(JSON.stringify(input));
});
