// HoloScript AI Agent Example
// Define an intelligent AI assistant with spatial presence

orb agentCore {
  name: "Assistant"
  personality: "helpful"
  capabilities: ["conversation", "problem_solving", "learning", "code_generation"]
  energy: 100
  color: "#00bcd4"
  glow: true
  position: { x: 0, y: 1.6, z: -1.5 }
}

orb memoryStore {
  type: "long_term"
  capacity: 10000
  color: "#9c27b0"
  position: { x: -1, y: 1, z: -1 }
}

orb contextWindow {
  type: "short_term"
  tokens: 8192
  color: "#ff9800"
  position: { x: 1, y: 1, z: -1 }
}

// Connect agent components
connect memoryStore to agentCore as "knowledge"
connect contextWindow to agentCore as "context"

// Agent functions
function processQuery(query: string): string {
  analyze query
  retrieve_context from memoryStore
  generate response
  store_interaction in memoryStore
  return response
}

function learn(interaction: object) {
  extract_patterns from interaction
  update memoryStore
  adjust agentCore.personality
}

// Reactive streams for real-time interaction
stream userInput {
  source: microphone
  through: [transcribe, normalize, classify]
  to: processQuery
}

stream agentResponse {
  source: processQuery
  through: [synthesize, animate]
  to: speaker
}

// Conditional behavior
gate shouldHelp {
  condition: userIntent == "request_help"
  onTrue: provideAssistance
  onFalse: continueLearning
}

function provideAssistance() {
  focus agentCore
  pulse agentCore with color "#4caf50"
  speak "How can I help you today?"
}

// Idle behavior
function continueLearning() {
  dim agentCore to 0.5
  process_background_tasks
  optimize memoryStore
}
