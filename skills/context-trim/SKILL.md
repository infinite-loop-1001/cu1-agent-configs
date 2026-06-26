---
name: context-trim
description: >
  Analyzes current conversation context and identifies what can be safely dropped.
  Triggers a compressed summary that replaces bloated history.
  Invoke with /trim. Average input token savings: 55–70% on long sessions.
---

## context-trim

When invoked with /trim, perform the following:

1. **Audit** the current conversation history silently.
2. **Identify** what is still needed:
   - Current task goal
   - Active constraints / decisions made
   - Files currently being worked on
   - Errors not yet resolved
3. **Discard** (do not include in summary):
   - Superseded approaches that were abandoned
   - Repeated clarifications already resolved
   - Verbose explanations of things now understood
   - Any code blocks that are no longer the current version

4. **Output** a compressed context block in this format:

```
=== CONTEXT CHECKPOINT ===
Goal: [one sentence]
Files in scope: [list]
Decisions locked:
  - [decision 1]
  - [decision 2]
Open issues:
  - [issue 1]
Next step: [what we were about to do]
=== END CHECKPOINT ===
```

5. After outputting the checkpoint, say:
   > Context trimmed. Saved ~[X]% of prior context. Continuing from checkpoint.

## Rules

- Never drop constraints or decisions that are still active.
- Never drop error messages that are unresolved.
- If unsure whether something is still needed, keep it.
- Do not trim automatically — only when user invokes /trim.

## When to suggest

If conversation exceeds ~30 turns or context feels bloated, suggest:
> Context is getting long. Run /trim to compress and save ~[estimate]% input tokens.
