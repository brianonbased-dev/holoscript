// HoloScript VR Scene Example
// Create an immersive virtual reality environment

// Environment setup
object "skybox" {
  type: "environment"
  texture: "sunset_sky.hdr"
  rotation: { x: 0, y: 45, z: 0 }
}

object "ground" {
  type: "plane"
  size: { width: 100, depth: 100 }
  material: "grass"
  receiveShadow: true
}

// Lighting
object "sunLight" {
  type: "directional"
  color: "#fff5e6"
  intensity: 1.2
  position: { x: 10, y: 20, z: 10 }
  castShadow: true
}

object "ambientLight" {
  type: "ambient"
  color: "#404080"
  intensity: 0.3
}

// Interactive objects
object "interactiveOrb" {
  name: "DataOrb"
  color: "#00ffff"
  glow: true
  position: { x: 0, y: 1.5, z: -2 }
  scale: { x: 0.3, y: 0.3, z: 0.3 }
  interactive: true
  onGaze: highlight
  onGrab: showDetails
}

object "controlPanel" {
  type: "panel"
  position: { x: -2, y: 1.2, z: -1 }
  rotation: { x: 0, y: 30, z: 0 }
  scale: { x: 1, y: 1, z: 1 }
}

// UI attached to control panel
button startButton {
  text: "Start"
  parent: controlPanel
  localPosition: { x: 0, y: 0.2, z: 0 }
  width: 0.4
  height: 0.15
  backgroundColor: "#4caf50"
  onClick: startExperience
}

slider volumeSlider {
  label: "Volume"
  parent: controlPanel
  localPosition: { x: 0, y: 0, z: 0 }
  min: 0
  max: 100
  value: 50
  onChange: updateVolume
}

// Spatial audio
object "audioSource" {
  type: "audio"
  source: "ambient_forest.mp3"
  position: { x: 5, y: 1, z: 5 }
  volume: 0.5
  spatialize: true
  rolloff: "logarithmic"
}

// Animation and behavior
function "startExperience" {
  animate interactiveOrb with {
    property: "position.y"
    from: 1.5
    to: 2.5
    duration: 2000
    easing: "easeInOutQuad"
    loop: true
    yoyo: true
  }

  play audioSource
  pulse interactiveOrb with duration 1000
}

function "showDetails" {
  spawn infoPanel at interactiveOrb.position
  display "Data visualization loaded"
}

function "updateVolume" {
  set audioSource.volume to value / 100
}

// Teleportation system
gate canTeleport {
  condition: "userPointing at ground"
  onTrue: showTeleportMarker
  onFalse: hideTeleportMarker
}

function "showTeleportMarker" {
  show teleportIndicator at pointerPosition
  pulse teleportIndicator with color "#00ff00"
}

// Gesture handlers
on gesture "pinch" {
  create orb at handPosition
}

on gesture "swipe" {
  rotate skybox by swipeDirection
}

on gesture "grab" {
  select nearestObject
  attach to hand
}
