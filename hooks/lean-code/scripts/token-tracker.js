#!/usr/bin/env node
/**
 * lean-code: token-tracker
 * Hook: PromptSubmit
 *
 * Reads token usage from the event payload, accumulates session totals,
 * and injects a warning into the context when the session grows large.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_DIR = path.join(os.tmpdir(), 'lean-code');
const STATE_FILE = path.join(STATE_DIR, 'session-tokens.json');

// Thresholds
const WARN_TOKENS = 20000;
const TRIM_TOKENS = 40000;

function loadState() {
  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (_) {}
  return { totalInputTokens: 0, totalOutputTokens: 0, promptCount: 0, sessionStart: Date.now() };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (_) {}
}

function estimateTokens(text) {
  // ~4 chars per token (rough estimate for mixed code/prose)
  return Math.ceil((text || '').length / 4);
}

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw); } catch (_) {}

  const state = loadState();
  state.promptCount = (state.promptCount || 0) + 1;

  // Extract token counts from event payload (Claude Code provides these)
  const inputTokens = input.inputTokens || input.input_tokens ||
    estimateTokens(input.prompt || input.message || '');
  state.totalInputTokens = (state.totalInputTokens || 0) + inputTokens;

  saveState(state);

  const total = state.totalInputTokens;
  const result = { ...input };

  if (total >= TRIM_TOKENS) {
    const msg = `[lean-code] ⚠️  Session context: ~${Math.round(total/1000)}k tokens. Run /trim now to save ~60% on upcoming messages.`;
    process.stderr.write(msg + '\n');
    // Inject reminder into the prompt context
    result.userFacingOutput = msg;
  } else if (total >= WARN_TOKENS) {
    const msg = `[lean-code] Session growing (~${Math.round(total/1000)}k tokens). Consider /checkpoint to compress.`;
    process.stderr.write(msg + '\n');
  }

  process.stdout.write(JSON.stringify(result));
});
