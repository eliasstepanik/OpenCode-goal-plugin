import assert from "node:assert/strict"
import pluginModule, { GoalPlugin } from "opencode-goal-plugin"

const sessionID = `smoke-${Date.now()}`
const promptCalls = []
const logCalls = []

const client = {
  app: {
    log: async (input) => {
      logCalls.push(input)
    },
  },
  session: {
    messages: async () => ({ data: [] }),
    promptAsync: async (input) => {
      promptCalls.push(input)
      return {}
    },
  },
}

assert.equal(pluginModule.id, "opencode-goal-plugin")
assert.equal(pluginModule.server, GoalPlugin)

const hooks = await GoalPlugin({ client }, { minDelayMs: 1 })
assert.equal(typeof hooks["command.execute.before"], "function")
assert.equal(typeof hooks.event, "function")
assert.equal(typeof hooks["experimental.chat.system.transform"], "function")

const commandHook = hooks["command.execute.before"]

async function runGoalCommand(args) {
  const output = { parts: [] }
  await commandHook({ command: "goal", sessionID, arguments: args }, output)
  assert.equal(output.parts.length, 1)
  assert.equal(output.parts[0].type, "text")
  return output.parts[0].text
}

assert.match(await runGoalCommand("status"), /No active goal/)
assert.match(await runGoalCommand("ship a smoke test --max-turns 1"), /New active goal/)
assert.match(await runGoalCommand("status"), /Active goal: ship a smoke test/)
assert.match(await runGoalCommand("clear"), /Goal cleared/)
assert.match(await runGoalCommand("status"), /No active goal/)
assert.equal(promptCalls.length, 0)
assert.equal(logCalls.length, 0)

console.log("opencode-goal-plugin command hook smoke passed")
