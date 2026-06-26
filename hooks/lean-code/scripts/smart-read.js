#!/usr/bin/env node
/**
 * lean-code: smart-read
 * Hook: PreToolUse (matcher: Read)
 *
 * When Claude tries to read a large file, intercepts the call and
 * outputs a warning + suggestion to use targeted grep instead.
 * For very large files (>500 lines), blocks the read and instructs
 * Claude to use grep first.
 */

'use strict';

const fs = require('fs');

const WARN_LINES = 100;   // Warn but allow
const BLOCK_LINES = 500;  // Block and require grep first

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw); } catch (_) {}

  const filePath = input.tool_input?.file_path || input.filePath || input.path || '';

  if (!filePath) {
    process.stdout.write(JSON.stringify(input));
    return;
  }

  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (_) {
    // File doesn't exist or can't be read — pass through
    process.stdout.write(JSON.stringify(input));
    return;
  }

  if (lineCount >= BLOCK_LINES) {
    // Block the read, force grep first
    const msg = [
      `[lean-code/smart-read] 🚫 Blocked: ${filePath} is ${lineCount} lines (~${Math.round(lineCount * 5)} tokens).`,
      `Run grep first to find what you need:`,
      `  grep -n "KEYWORD" ${filePath}`,
      `Then read only the relevant line range:`,
      `  sed -n 'START,ENDp' ${filePath}`,
      `Override with: read-full ${filePath}`
    ].join('\n');

    process.stderr.write(msg + '\n');
    process.stdout.write(JSON.stringify({
      ...input,
      stopReason: msg,
    }));
    return;
  }

  if (lineCount >= WARN_LINES) {
    const estimated = Math.round(lineCount * 5);
    const msg = `[lean-code/smart-read] ⚡ ${filePath}: ${lineCount} lines (~${estimated} tokens). Grep first if you only need one function.`;
    process.stderr.write(msg + '\n');
  }

  // Allow the read
  process.stdout.write(JSON.stringify(input));
});
