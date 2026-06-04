# Security Policy

## Supported Versions

This project is experimental. Security fixes are provided for the latest published version only.

## Reporting a Vulnerability

GitHub private vulnerability reporting may not always be enabled for this repository.

Until a dedicated private reporting channel is documented here, do **not** open a public issue with exploit details, credentials, local paths, or reproduction steps that could expose user data or local system access.

Instead:

1. open a minimal public issue asking for a private contact path, or
2. contact the maintainer through their GitHub profile and request a private handoff.

## Scope

This plugin does not intentionally read credentials, write arbitrary user files, or execute shell commands. It observes OpenCode session events, injects goal context into prompts, and sends continuation prompts through OpenCode's SDK client.

Relevant security-sensitive areas include:

- prompt-injection resistance for goal text
- unexpected auto-continuation behavior
- incorrect command or hook handling across OpenCode versions
- leakage of goal text through logs or status output
- malformed persisted state causing stale or unexpected goal recovery

The goal text is wrapped in `<goal_objective>` tags and the closing tag is escaped before insertion. Other structural tags used in continuation prompts (`<goal_continuation>`, `<progress_budget>`, etc.) are not escaped. Crafted goal text containing those literal strings would close the tag early in the plaintext prompt; the model still receives plaintext rather than true privileged structure, but you should still treat goal text as trusted local input rather than pasting in arbitrary third-party content.
