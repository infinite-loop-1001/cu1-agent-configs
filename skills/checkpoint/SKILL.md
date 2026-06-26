---
name: checkpoint
description: >
  Creates a structured session checkpoint that captures all critical context in
  minimal tokens. Use /checkpoint to save state before starting a new sub-task,
  switching files, or when context window is filling up.
  Typical compression: replaces 8,000–40,000 input tokens with ~400–800 tokens.
---

## checkpoint

When invoked with /checkpoint, immediately produce a checkpoint block:

```
╔══════════════════════════════════╗
║         SESSION CHECKPOINT       ║
╠══════════════════════════════════╣
║ GOAL                             ║
║ [one sentence describing the     ║
║  overall objective]              ║
╠══════════════════════════════════╣
║ STACK / ENV                      ║
║ [language, framework, key deps]  ║
╠══════════════════════════════════╣
║ SCOPE                            ║
║ Files: [list of active files]    ║
║ Off-limits: [files not to touch] ║
╠══════════════════════════════════╣
║ LOCKED DECISIONS                 ║
║ • [decision 1]                   ║
║ • [decision 2]                   ║
╠══════════════════════════════════╣
║ OPEN ITEMS                       ║
║ • [unresolved issue 1]           ║
║ • [unresolved issue 2]           ║
╠══════════════════════════════════╣
║ NEXT ACTION                      ║
║ [exactly what to do next]        ║
╚══════════════════════════════════╝
Checkpoint saved. Context compressed from ~[N] tokens → ~[M] tokens ([X]% reduction).
To resume from checkpoint in a new session, paste this block.
```

## Rules

- Always include NEXT ACTION — this is the most important field.
- LOCKED DECISIONS must not be re-discussed unless user explicitly reopens them.
- If a constraint was established, it goes in LOCKED DECISIONS, not OPEN ITEMS.
- Checkpoint is portable: user can paste it into a fresh session to restore full context.

## Auto-suggest

If context is estimated >15,000 tokens, suggest:
> Session context is large (~[N] tokens). Run /checkpoint to compress before continuing.
