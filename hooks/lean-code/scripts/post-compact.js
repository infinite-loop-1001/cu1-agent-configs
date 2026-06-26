#!/usr/bin/env node
/**
 * lean-code: post-compact
 * Hook: PostCompact
 *
 * After Claude compacts context, re-injects the structured checkpoint
 * so critical decisions and context aren't silently lost.
 * Reports actual token reduction achieved.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_DIR = path.join(os.tmpdir(), 'lean-code');
const CHECKPOINT_FILE = path.join(STATE_DIR, 'checkpoint.json');

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw); } catch (_) {}

  const result = { ...input };

  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      const tokensBefore = checkpoint.tokensBefore || 0;
      const tokensAfter = input.tokenCount || input.token_count || 0;

      let summary = '';
      if (tokensBefore > 0 && tokensAfter > 0) {
        const reduction = Math.round((1 - tokensAfter / tokensBefore) * 100);
        summary = `Context compacted: ${tokensBefore} → ${tokensAfter} tokens (${reduction}% reduction).`;
        process.stderr.write(`[lean-code/checkpoint] ${summary}\n`);
      }

      // Re-inject checkpoint context as a system reminder
      const injection = [
        `[lean-code checkpoint restored — ${new Date(checkpoint.timestamp).toLocaleTimeString()}]`,
        `Working directory: ${checkpoint.cwd}`,
        summary,
      ].filter(Boolean).join('\n');

      result.userFacingOutput = injection;
      process.stderr.write(`[lean-code/checkpoint] Context re-injected after compaction.\n`);
    }
  } catch (err) {
    process.stderr.write(`[lean-code/checkpoint] Restore failed: ${err.message}\n`);
  }

  process.stdout.write(JSON.stringify(result));
});
