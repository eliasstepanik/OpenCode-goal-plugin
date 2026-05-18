# Changelog

## 0.1.4 — 2026-05-18

- Fix `parseGoalArguments` to reject flags-as-values and dangling flags (e.g. `/goal fix tests --max-turns --max-tokens 50000` no longer corrupts the condition or silently swallows flags).
- Fix `/goal resume` to no-op when the goal is already running instead of resetting `lastContinueAt`.
- Fix `experimental.chat.system.transform` to strip the trailing newline from the system block when no limit warnings apply, matching `buildContinueMessage` behavior.
- Remove live `seenTokens`/`seenOutputTokens` Map references from `testInternals`.
- Update OpenCode command examples to use `$ARGUMENTS`.
- Clarify OpenCode compatibility, in-memory goal lifetime, token-budget limits, and manual smoke testing.
- Add CI, contribution, and security policy files.
- Track assistant output progress separately from broad token-budget accounting.
- Expand test coverage: `--max-duration-ms` flag, dangling/adjacent flags, `promptAsync` error path, thrown-error recovery, `[goal:complete]` state cleanup, already-sent wrapup silent stop, multi-session isolation, `formatStatus` shape, and command no-active-goal paths.

## 0.1.3

- Add structured continuation prompts with goal framing, budget context, and completion-audit instructions.
- Wrap goal text as user-provided task data in `<goal_objective>` tags.
- Use UUID goal IDs for stale-update protection.
- Pause auto-continue after near-zero-output turns.
- Add budget wrap-up prompts near the tracked token limit.
- Store blocked reasons for `/goal status`.
- Track `lastProgressAt` and no-progress turn count in status.
- Add `/goal resume` for stopped in-memory goals.

## 0.1.2

- Fix package entrypoints for OpenCode package resolution.
- Export the plugin using OpenCode's v1 plugin module shape.
- Add `session.status` idle handling alongside deprecated `session.idle`.
- Tighten completion marker matching to final-line markers only.
- Add stale-goal checks around awaited idle-handler work.
- Make system prompt injection idempotent.
- Add tests for marker matching, option parsing, idle handling, and clear-during-idle behavior.

## 0.1.1

- Add configurable safety limits and per-goal overrides.
- Add cooldown and near-limit warnings.
- Clean up tracked message token entries when goals are cleared.

## 0.1.0

- Initial experimental marker-based `/goal` plugin.
