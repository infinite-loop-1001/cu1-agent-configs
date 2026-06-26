#!/usr/bin/env node
/**
 * lean-code: pre-compact
 * Hook: PreCompact
 *
 * Before Claude compacts/compresses context, saves a structured
 * checkpoint to disk. This ensures nothing critical is lost
 * even if compaction drops important context.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_DIR = path.join(os.tmpdir(), 'lean-code');
const CHECKPOINT_FILE = path.join(STATE_DIR, 'checkpoint.json');
const CHECKPOINT_MD = path.join(STATE_DIR, 'checkpoint.md');

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw); } catch (_) {}

  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

    const checkpoint = {
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      preCompactContext: input.context || input.summary || '',
      tokensBefore: input.tokenCount || input.token_count || 0,
      savedBy: 'lean-code/pre-compact',
    };

    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));

    // Also write a human-readable markdown version
    const md = [
      `# lean-code Checkpoint`,
      `Saved: ${checkpoint.timestamp}`,
      `Directory: ${checkpoint.cwd}`,
      `Tokens before compact: ${checkpoint.tokensBefore}`,
      ``,
      `## Context`,
      checkpoint.preCompactContext || '(no context captured)',
    ].join('\n');
    fs.writeFileSync(CHECKPOINT_MD, md);

    process.stderr.write(`[lean-code/checkpoint] Context saved to ${CHECKPOINT_FILE}\n`);
  } catch (err) {
    process.stderr.write(`[lean-code/checkpoint] Save failed: ${err.message}\n`);
  }

  process.stdout.write(JSON.stringify(input));
});
