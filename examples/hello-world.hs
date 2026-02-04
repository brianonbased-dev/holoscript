// HoloScript Hello World Example
// A simple greeting orb that displays a welcome message

object "greeting" {
  message: "Hello, HoloScript World!"
  color: "#00ffff"
  glow: true
  position: { x: 0, y: 1.5, z: -2 }
}

function "displayGreeting" {
  show greeting
  pulse greeting with duration 1000
}

// Execute on load
execute displayGreeting
