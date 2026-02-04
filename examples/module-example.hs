// HoloScript Module System Example
// Demonstrates import/export functionality

// Import from other modules
import { Vector3, Color } from "holoscript-math"
import DataProcessor from "data-utils"

// Export functions for other modules to use
export function "createInteractiveOrb" {
  object "dynamicOrb" {
    name: name
    position: position
    color: "#00ffff"
    glow: true
    interactive: true
    onClick: handleClick
  }
  return dynamicOrb
}

export function "handleClick" {
  pulse this with {
    color: "#ff0000"
    duration: 500
  }
  emit "orb:clicked" with { target: this.name }
}

// Private helper (not exported)
function "validatePosition" : boolean {
  return pos.x != null && pos.y != null && pos.z != null
}

// Export constants
export const ORB_DEFAULTS = {
  color: "#00ffff",
  glow: true,
  size: 1,
  interactive: true
}

// Export a class-like building
export building InteractiveScene {
  orbs: []
  connections: []

  function "addOrb" {
    const newOrb = createInteractiveOrb(config.name, config.position)
    push this.orbs with newOrb
  }

  function "connectAll" {
    for (i = 0; i < length(this.orbs) - 1; i++) {
      connect this.orbs[i] to this.orbs[i + 1] as "data"
    }
  }
}
