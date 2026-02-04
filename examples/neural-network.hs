// HoloScript Neural Network Visualization
// Visualize a simple neural network with connections

object "inputLayer" {
  neurons: 784
  color: "#4CAF50"
  position: { x: -3, y: 2, z: 0 }
  label: "Input Layer (28x28 pixels)"
}

object "hiddenLayer1" {
  neurons: 256
  color: "#2196F3"
  position: { x: -1, y: 2, z: 0 }
  label: "Hidden Layer 1"
}

object "hiddenLayer2" {
  neurons: 128
  color: "#9C27B0"
  position: { x: 1, y: 2, z: 0 }
  label: "Hidden Layer 2"
}

object "outputLayer" {
  neurons: 10
  color: "#FF5722"
  position: { x: 3, y: 2, z: 0 }
  label: "Output Layer (0-9 digits)"
}

// Connect layers with weighted connections
connection { from: "inputLayer", to: "hiddenLayer1", type: "weights_1" }
connection { from: "hiddenLayer1", to: "hiddenLayer2", type: "weights_2" }
connection { from: "hiddenLayer2", to: "outputLayer", type: "weights_3" }

function "trainNetwork" : object {
  forward_pass data
  calculate_loss
  backward_pass
  update_weights
  return metrics
}

function "visualizeActivations" {
  highlight layer with color "gold"
  show layer.neurons as particles
}

// Training loop
stream trainingData {
  source: dataset
  through: [normalize, batch, shuffle]
  to: trainNetwork
}
