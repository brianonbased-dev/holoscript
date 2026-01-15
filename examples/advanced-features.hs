// HoloScript Advanced Features Example
// Demonstrates Phase 2 language features: loops, imports, variables

// Variable declarations
const MAX_ORBS = 10
let currentCount = 0
const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]

// Create an orb with configurable properties
orb configurable {
  name: "ConfigurableOrb"
  color: "#00ffff"
  glow: true
  position: { x: 0, y: 1.5, z: -2 }
  interactive: true
}

// Function to create multiple orbs in a pattern
function createOrbGrid(rows: number, cols: number) {
  for (i = 0; i < rows; i++) {
    for (j = 0; j < cols; j++) {
      spawn orb at { x: i * 2, y: 0.5, z: j * 2 }
    }
  }
}

// Process an array of data
function processItems(items: array) {
  forEach item in items {
    show item
    pulse item with color "#4caf50"
  }
}

// Conditional logic with gates
gate shouldAnimate {
  condition: currentCount < MAX_ORBS
  onTrue: animateOrbs
  onFalse: displayComplete
}

// Animation function
function animateOrbs() {
  animate configurable with {
    property: "position.y"
    from: 1.5
    to: 3.0
    duration: 2000
    easing: "easeInOutQuad"
    loop: true
    yoyo: true
  }
}

// Completion handler
function displayComplete() {
  show messageOrb
  set messageOrb.text to "Animation Complete!"
}

// Data stream with transformations
stream dataProcessor {
  source: sensorData
  through: [
    filter(value > 0),
    map(value * 2),
    sort,
    take(5)
  ]
  to: displayResults
}

// While loop for continuous monitoring
function monitor() {
  while (isActive) {
    check sensorData
    update display
    wait 100
  }
}

// Connect orbs for data flow
connect configurable to dataProcessor as "events"

// Initialize the scene
function init() {
  createOrbGrid(3, 3)
  processItems(COLORS)
}
