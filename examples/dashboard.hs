// HoloScript Dashboard Example
// A complete analytics dashboard with multiple components

// Layout panels
panel sidebar {
  x: 0
  y: 0
  width: 220
  height: 700
  backgroundColor: "#1a1a2e"
}

panel mainContent {
  x: 220
  y: 0
  width: 980
  height: 700
  backgroundColor: "#f5f5f5"
}

// Sidebar navigation
text logo {
  content: "Analytics"
  x: 30
  y: 30
  fontSize: 20
  color: "#ffffff"
  fontWeight: "bold"
}

button navDashboard {
  text: "Dashboard"
  x: 20
  y: 80
  width: 180
  height: 40
  backgroundColor: "#667eea"
  textColor: "#ffffff"
  icon: "dashboard"
}

button navReports {
  text: "Reports"
  x: 20
  y: 130
  width: 180
  height: 40
  backgroundColor: "transparent"
  textColor: "#888888"
  icon: "chart"
}

button navSettings {
  text: "Settings"
  x: 20
  y: 180
  width: 180
  height: 40
  backgroundColor: "transparent"
  textColor: "#888888"
  icon: "settings"
}

// Header
text pageTitle {
  content: "Dashboard Overview"
  x: 250
  y: 30
  fontSize: 24
  color: "#333333"
}

button refreshBtn {
  text: "Refresh"
  x: 1080
  y: 25
  width: 100
  height: 36
  backgroundColor: "#667eea"
  textColor: "#ffffff"
  onClick: refreshData
}

// Metric cards
panel cardVisitors {
  x: 250
  y: 80
  width: 220
  height: 120
  backgroundColor: "#ffffff"
  borderRadius: 8
  shadow: true
}

text visitorsLabel {
  content: "Total Visitors"
  x: 270
  y: 100
  fontSize: 14
  color: "#888888"
}

text visitorsValue {
  content: "24,521"
  x: 270
  y: 130
  fontSize: 32
  color: "#333333"
  fontWeight: "bold"
}

text visitorsChange {
  content: "+12.5%"
  x: 270
  y: 170
  fontSize: 14
  color: "#4caf50"
}

panel cardRevenue {
  x: 490
  y: 80
  width: 220
  height: 120
  backgroundColor: "#ffffff"
  borderRadius: 8
  shadow: true
}

text revenueLabel {
  content: "Revenue"
  x: 510
  y: 100
  fontSize: 14
  color: "#888888"
}

text revenueValue {
  content: "$89,420"
  x: 510
  y: 130
  fontSize: 32
  color: "#333333"
  fontWeight: "bold"
}

text revenueChange {
  content: "+8.2%"
  x: 510
  y: 170
  fontSize: 14
  color: "#4caf50"
}

// Chart area
panel chartPanel {
  x: 250
  y: 220
  width: 700
  height: 300
  backgroundColor: "#ffffff"
  borderRadius: 8
  shadow: true
}

text chartTitle {
  content: "Weekly Performance"
  x: 270
  y: 240
  fontSize: 16
  color: "#333333"
  fontWeight: "bold"
}

// Data streams
stream metricsStream {
  source: analyticsAPI
  through: [aggregate, format]
  to: updateDashboard
}

function refreshData() {
  show loader
  fetch metricsStream
  animate charts with transition "smooth"
  hide loader
}

function updateDashboard(data: object) {
  update visitorsValue with data.visitors
  update revenueValue with data.revenue
  redraw charts with data.timeSeries
}
