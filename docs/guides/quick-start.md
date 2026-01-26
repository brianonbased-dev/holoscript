# Quick Start

Get up and running with HoloScript in 5 minutes.

## 1. Install VS Code Extension

```bash
ext install holoscript.holoscript-vscode
```

Or search "HoloScript Enhanced" in the VS Code extensions marketplace.

## 2. Create a New File

Create a file with one of these extensions:
- `demo.holo` - For scene compositions
- `demo.hsplus` - For objects with VR traits
- `demo.hs` - For classic HoloScript

## 3. Write Your First Scene

Create `hello.holo`:

```holo
composition "My First Scene" {
  environment {
    skybox: "sunset"
    ambient_light: 0.4
    gravity: -9.81
  }

  object "Player" {
    @collidable
    @physics
    position: [0, 1.6, 0]
    
    state {
      health: 100
      speed: 5
    }
  }

  object "FloatingOrb" {
    @grabbable
    @glowing
    @physics
    
    position: [0, 1.5, -2]
    color: "#00ffff"
    
    on_grab: {
      this.glow_intensity = 2.0
    }
    
    on_release: {
      this.glow_intensity = 0.5
    }
  }

  logic {
    on_player_touch(orb) {
      Player.health += 10
      orb.destroy()
    }
  }
}
```

## 4. Preview Your Scene

Use the VS Code command palette (`Ctrl+Shift+P`) and run:
- **HoloScript: Preview Scene** - Opens a 3D preview
- **HoloScript: Validate** - Checks for errors

## 5. Compile to Target Platform

```bash
# Install CLI
npm install -g @holoscript/cli

# Compile to Three.js
holoscript compile hello.holo --target threejs

# Compile to Unity
holoscript compile hello.holo --target unity

# Compile to VRChat
holoscript compile hello.holo --target vrchat
```

## What's Next?

- [VR Traits](./traits) - Add interactivity with @grabbable, @physics, @networked
- [Compositions](./compositions) - Build complex multi-object scenes
- [AI Integration](./ai-agents) - Use MCP server with Claude, GPT, or Brittney
