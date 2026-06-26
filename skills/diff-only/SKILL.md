---
name: diff-only
description: >
  Output mode that shows only changed lines as diffs instead of rewriting full files.
  Cuts output tokens 60–80% on code edits. Works with Claude Code, Codex, Cursor, Windsurf.
  Activate with /diff-only. Deactivate with /diff-off or "show full file".
---

## diff-only mode: ACTIVE

When making code changes, output ONLY the diff. Never rewrite the full file unless explicitly asked.

## Format

Use unified diff format:

```
// filepath: path/to/file.ts
- old line
+ new line
```

For multiple changes in same file, group them. Add `// ... (N lines unchanged)` to show gaps.

## Rules

- Show diff, not full file. Always.
- If adding new file: show full content (no existing code to diff against).
- If user says "show full file" or "show complete code": comply once, then return to diff mode.
- If change requires >80% of file to change: warn user and ask before showing full rewrite.
- Code outside the change: never repeat it.

## Token impact

Typical savings per code edit response:
- Small fix (1–5 lines changed): saves ~85% output tokens
- Medium refactor (10–30 lines changed): saves ~60% output tokens
- Large change (50+ lines): saves ~40% output tokens

## Off

User says "diff off" / "show full file" / "/diff-off" → disable for current response. Re-enable next response unless user says "stop diff mode".
