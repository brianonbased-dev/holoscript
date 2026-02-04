// HoloScript 2D UI Example - Login Form
// Demonstrates 2D UI elements for web interfaces

panel loginPanel {
  x: 50
  y: 50
  width: 320
  height: 400
  backgroundColor: "#ffffff"
  borderRadius: 8
  shadow: true
}

text title {
  content: "Welcome Back"
  x: 100
  y: 70
  fontSize: 24
  color: "#333333"
  fontWeight: "bold"
}

text subtitle {
  content: "Sign in to continue"
  x: 100
  y: 100
  fontSize: 14
  color: "#666666"
}

textinput usernameInput {
  placeholder: "Username or Email"
  x: 100
  y: 150
  width: 220
  height: 40
  borderColor: "#e0e0e0"
  focusBorderColor: "#667eea"
}

textinput passwordInput {
  placeholder: "Password"
  x: 100
  y: 210
  width: 220
  height: 40
  type: "password"
  borderColor: "#e0e0e0"
  focusBorderColor: "#667eea"
}

checkbox rememberMe {
  label: "Remember me"
  x: 100
  y: 270
  checked: false
}

button loginBtn {
  text: "Sign In"
  x: 100
  y: 320
  width: 220
  height: 44
  backgroundColor: "#667eea"
  hoverColor: "#5a6fd6"
  textColor: "#ffffff"
  borderRadius: 6
  onClick: handleLogin
}

text forgotPassword {
  content: "Forgot password?"
  x: 160
  y: 380
  fontSize: 12
  color: "#667eea"
  cursor: "pointer"
  onClick: showResetForm
}

// Event handlers
function "handleLogin" {
  validate usernameInput
  validate passwordInput

  gate isValid {
    condition: "validationPassed"
    onTrue: submitCredentials
    onFalse: showError
  }
}

function "submitCredentials" {
  show loader
  authenticate usernameInput.value passwordInput.value
  navigate to dashboard
}

function "showError" {
  shake loginPanel
  highlight errors with color "red"
}
