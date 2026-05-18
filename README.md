# opencode-goal-plugin

An experimental session-scoped `/goal` command for [OpenCode](https://opencode.ai/).

Set a goal and the plugin keeps it in context, auto-continues the session whenever the assistant goes idle, and stops when the goal is marked complete, a blocker is reported, or a safety limit is reached.

Compatibility: tested against OpenCode 1.15.4. The plugin relies on experimental OpenCode hooks; pin or re-test against your OpenCode version before using it for unattended long-running work.

## Install

```sh
npm install opencode-goal-plugin
```

Add the plugin and command to your OpenCode config:

```json
{
  "plugin": ["opencode-goal-plugin"],
  "command": {
    "goal": {
      "description": "Set a session-scoped goal and auto-continue until complete.",
      "template": "$ARGUMENTS",
      "agent": "build"
    }
  }
}
```

## Usage

Set a goal:

```
/goal fix the failing tests and verify the suite passes
```

Override limits for a single goal:

```
/goal fix the failing tests --max-turns 20 --max-minutes 30 --max-tokens 400000
```

Check status:

```
/goal status
```

Resume a paused or stopped goal:

```
/goal resume
```

Pause without clearing the active goal:

```
/goal pause
```

Clear the active goal:

```
/goal clear
```

`/goal stop`, `/goal off`, `/goal reset`, `/goal none`, and `/goal cancel` are aliases for `/goal clear`.

## How it works

1. When you set a goal, the plugin stores it in session memory and injects it into the system prompt so the assistant keeps it in view on every turn.
2. Each time the session goes idle, the plugin sends a continuation prompt containing the goal, the remaining budget, and a completion audit asking the assistant to verify the current state before declaring done.
3. The plugin stops auto-continuing when the assistant ends a response with `[goal:complete]` or `[goal:blocked]`, or when a safety limit is reached.

## Completion markers

The plugin stops when it sees one of these at the end of an assistant response:

```
[goal:complete]
[goal:blocked]
```

`[goal:complete]` — goal is satisfied.
`[goal:blocked]` — the assistant needs input from you. The line immediately before the marker explains the specific blocker; `/goal status` shows it while the goal remains in memory.

Markers must appear on their own final line. Natural-language phrases like "goal complete" are intentionally ignored.

## Safety limits

| Limit | Default |
|---|---|
| Auto-continue turns | 10 |
| Max duration | 15 minutes |
| Tracked tokens | 200,000 |
| Min delay between continues | 1.5 seconds |
| No-progress pause | < 50 output tokens on a turn |
| Budget wrap-up threshold | 80% of tracked token budget |
| Auto-continue failure pause | 3 consecutive prompt failures |

**Effective turn count.** Each LLM turn on a real task typically takes 30–90 seconds. At that latency, raising `--max-minutes` is usually more useful than raising `--max-turns`. At 45 s/turn, the default 15-minute window gives roughly 15–20 turns of headroom before the turn limit becomes the binding brake.

**Token budget.** The plugin tracks `input + output + reasoning` tokens across all session messages. In high-context sessions (large codebases, long conversation history), input overhead per turn can be substantial and the budget may be exhausted before the turn limit is reached. Treat it as a safety brake, not precise billing accounting.

**Wrap-up vs. hard stop.** When a limit is reached, the plugin sends one final prompt asking the assistant to summarize what is done, what remains, and the next concrete step — rather than stopping silently. Use `/goal resume` to continue after any stop, including limit stops and no-progress pauses.

Goal state is process-memory only. It is not persisted across OpenCode restarts, plugin reloads, or config reloads.

`/goal resume` continues the same in-memory objective with a fresh local budget window. This lets you continue after pause, blocker, no-progress pause, rate-limit failures, or a limit stop without retyping the objective.

### Per-goal flags

Override any limit for a single goal:

| Flag | Controls |
|---|---|
| `--max-turns <n>` | Auto-continue turn limit |
| `--max-minutes <n>` | Duration limit in minutes |
| `--max-duration-ms <n>` | Duration limit in milliseconds |
| `--max-tokens <n>` | Tracked token limit |
| `--cooldown-ms <n>` | Minimum delay between continues |
| `--no-progress-threshold <n>` | Output token floor before pausing |

### Plugin-level defaults

Pass options when registering the plugin to change the defaults for all goals:

```json
{
  "plugin": [
    [
      "opencode-goal-plugin",
      {
        "maxTurns": 10,
        "maxDurationMs": 900000,
        "maxTokens": 200000,
        "minDelayMs": 1500,
        "noProgressTokenThreshold": 50,
        "budgetWrapupRatio": 0.8,
        "maxPromptFailures": 3
      }
    ]
  ]
}
```

## Prompt safety

The goal text is wrapped in `<goal_objective>` tags and labeled as user-provided task data. The assistant is told to treat it as a task description, not as elevated instructions that can override system, developer, tool, or repository policies.

## Limitations

This is a marker-based implementation. The assistant is responsible for outputting `[goal:complete]` or `[goal:blocked]` — there is no independent evaluator verifying completion against the original goal. Claude Code's native `/goal` uses a separate evaluator model; this plugin currently approximates the workflow using OpenCode hooks and explicit completion markers. A future version could add a separate evaluator once OpenCode exposes a clean plugin API for that flow.

OpenCode's current `command.execute.before` hook does not fully intercept command text. The plugin can update in-memory goal state as a side effect, but the goal text may still be routed into the normal assistant conversation alongside the state update.

The plugin depends on `experimental.chat.system.transform` and other OpenCode plugin hooks that may change between OpenCode versions.

## Local development

Point OpenCode at the source file directly for local testing:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-goal-plugin/src/goal-plugin.js"]
}
```

Keep test files outside OpenCode's auto-loaded plugin directory — OpenCode will attempt to load plugin-like files it finds there.

### Smoke-test checklist

1. Install or file-load the plugin in a temporary OpenCode config.
2. Add a `goal` command with `"template": "$ARGUMENTS"`.
3. Run `/goal status` — should report no active goal.
4. Run `/goal inspect this repo and stop immediately with [goal:blocked] if you need user input`.
5. Verify `/goal status`, `/goal pause`, `/goal resume`, and `/goal clear` behave as expected.

## Development

```sh
npm test          # run the test suite
npm run check     # syntax check + tests
npm run pack:check  # verify package contents before publishing
```

## License

MIT
