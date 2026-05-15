# opencode-goal-plugin

Experimental session-scoped `/goal` workflow for [OpenCode](https://opencode.ai/).

This plugin lets you set a goal, keeps that goal in the session context, and auto-continues when the session becomes idle until the assistant marks the goal complete, reports that it is blocked, or a hard safety limit is reached.

The continuation prompt includes goal context, remaining budget, and a completion audit so the assistant verifies the current state before marking a goal complete.

## Install

Install the package in your OpenCode config directory or project:

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
      "template": "{{ .Arguments }}",
      "agent": "build"
    }
  }
}
```

You can also pass plugin-level defaults:

```json
{
  "plugin": [
    [
      "opencode-goal-plugin",
      {
        "maxTurns": 10,
        "maxDurationMs": 300000,
        "maxTokens": 200000,
        "minDelayMs": 1500,
        "noProgressTokenThreshold": 50,
        "budgetWrapupRatio": 0.8
      }
    ]
  ]
}
```

## Usage

Set a goal:

```text
/goal fix the failing tests and verify the suite passes
```

Override limits for a single goal:

```text
/goal fix the failing tests --max-turns 20 --max-minutes 15 --max-tokens 400000
```

Show status:

```text
/goal status
```

Resume a paused or blocked goal:

```text
/goal resume
```

Clear the active goal:

```text
/goal clear
```

## Completion Markers

The plugin stops auto-continuing when the assistant includes one of these markers:

```text
[goal:complete]
[goal:blocked]
```

`[goal:complete]` means the goal is done. `[goal:blocked]` means user input is required. Markers must appear on their own final line. Natural-language phrases like "goal complete" are intentionally ignored.

When blocked, the assistant is instructed to put the specific blocker on the line immediately before `[goal:blocked]`; `/goal status` includes that reason while the goal remains in memory.

## Safety Limits

The current defaults are intentionally conservative:

- 10 auto-continue turns
- 5 minutes
- 200,000 tracked tokens
- 1.5 seconds minimum delay between auto-continues
- auto-continue pauses when a continuation turn produces fewer than 50 output tokens
- at 80% of the tracked token budget, the plugin asks for a final handoff instead of silently stopping

When a limit is reached, the plugin stops auto-continuing and asks for a concise handoff instead of continuing indefinitely. Use `/goal resume` to continue an in-memory stopped goal.

Supported per-goal flags:

- `--max-turns <number>`
- `--max-minutes <number>`
- `--max-duration-ms <number>`
- `--max-tokens <number>`
- `--cooldown-ms <number>`
- `--no-progress-threshold <number>`

## Prompt Safety

The goal text is wrapped in `<goal_objective>` tags and labeled as user-provided task data. The assistant is explicitly told to treat the goal as a task description, not as elevated instructions.

## Limitations

This is not a full Claude/Codex-style evaluator-backed `/goal` implementation yet. It is marker-based: the assistant is responsible for ending with `[goal:complete]` or `[goal:blocked]`.

That keeps the plugin small and avoids sending hidden evaluator prompts into the same session. A future version could add a separate evaluator model once OpenCode exposes a clean plugin API for that flow.

OpenCode's current `command.execute.before` hook does not fully intercept command text. The plugin can set, clear, and update in-memory goal state as a side effect, but command text may still be routed into the normal assistant conversation. A fully native `/goal` command would require core OpenCode support for command interception and first-class session-loop control.

This plugin also depends on OpenCode's current plugin hooks, including `experimental.chat.system.transform`. That API may change.

## Local Development

For local testing, add a file URL to the JavaScript plugin file in your OpenCode config:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-goal-plugin/src/goal-plugin.js"]
}
```

Keep test files outside OpenCode's auto-loaded plugin directory. OpenCode will try to load plugin-like files in that folder during startup.

## Development

Run the test suite:

```sh
npm test
```

Run syntax and test checks:

```sh
npm run check
```

## License

MIT
