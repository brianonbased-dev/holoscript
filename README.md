# HoloScript

**Write less code. Build more.**

A declarative language that compiles to 9 platforms from one source.

<p align="center">
  <a href="#-vrchat-alpha">
    <img src="https://img.shields.io/badge/🎮_VRChat_Alpha-NOW_AVAILABLE-ff6600?style=for-the-badge" alt="VRChat Alpha">
  </a>
</p>

<p align="center">
  <img src="docs/assets/gifs/holoscript-compile-demo.gif" alt="HoloScript compiling to multiple platforms" width="650">
  <br>
  <em>One file → Web, VR, AR, iOS, Android, Desktop</em>
</p>

---

## 📁 File Types

**Not sure which to use?**
- **`.holo`** → You're learning or building something simple
- **`.hsplus`** → You need multiplayer, advanced physics, or marketplace features

| Extension | What It Does |
|-----------|-------------|
| `.holo` | Standard HoloScript – objects, animations, basic UI |
| `.hsplus` | HoloScript Plus – adds networking, physics joints, procedural gen |

> 💡 **Start with `.holo`**. Upgrade to `.hsplus` when your project grows.

---

> 💬 **Talk or type to build.** Powered by [Infinity Assistant](https://infinityassistant.io).
>
> - 🥽 **VR:** "Create a coffee shop with a counter and menu board"
> - 🌍 **VRR:** "Scan my storefront and make it a virtual showroom" *(coming soon)*
> - 📱 **AR:** "Place a 3D model of this chair in my living room"

```holoscript
form#login @grabbable {
  input#email { placeholder: "Email" }
  input#password { type: "password" }
  button#submit { 
    text: "Sign In"
    @on_click: () -> { await api.login() }
  }
}
```

One component. Runs on **Web, VR, AR, iOS, Android, Desktop**. No rewrites.

## Why HoloScript?

| Before | After |
|--------|-------|
| 9 separate codebases | 1 HoloScript file |
| ~50,000 lines across platforms | ~500 lines |
| Months of maintenance | Build once, deploy everywhere |

**Real result:** We reduced our own service codebase by **90%** using HoloScript.

## Install

```bash
npm install @holoscript/core
```

## Quick Start

```typescript
import { HoloScriptPlusParser } from '@holoscript/core';

const parser = new HoloScriptPlusParser();
const result = parser.parse(`
  orb#sphere @grabbable @throwable {
    color: "#00ffff"
    glow: true
  }
`);
```

## Features

- **49 VR Traits** - `@grabbable`, `@throwable`, `@skeleton`, `@material`, `@lighting`, and 44 more
- **@world Configuration** - Declarative scene setup in `.hsplus` files
- **Scale Magnitude** - Build from `galactic` to `atomic` scale with seamless transitions
- **Reactive State** - `@state { count: 0 }` with automatic updates
- **Control Flow** - `@for`, `@if`, `while`, `forEach` loops
- **Module System** - `@import "./other.hsplus"` for code organization
- **Native Game Logic** - `@npc "Name" { ... }` and `@dialog` definitions
- **LSP Support** - Full IDE integration with completions, hover, and diagnostics
- **Voice Commands** - Build by speaking (Web Speech API)
- **AI Building** - Natural language to code via [infinityassistant.io](https://infinityassistant.io)

## Packages

| Package | Version | What it does | Status |
|---------|---------|--------------|--------|
| `@holoscript/core` | 2.1.0 | Parser, runtime, types | ✅ |
| `@holoscript/cli` | 1.0.0 | Command line tools + LSP | ✅ |
| `@holoscript/three-adapter` | 1.0.0 | Three.js 3D world integration | ✅ **New** |
| `@holoscript/infinityassistant` | 1.0.0 | AI building client | ✅ |
| `@holoscript/creator-tools` | 0.9.0 | Visual editors | 🟡 *beta* |

## 🌐 Three.js World Integration

> **NEW!** Run HoloScript directly in Three.js with full VR/XR support.

```bash
npm install @holoscript/three-adapter three
```

```typescript
import { createWorld } from '@holoscript/three-adapter';

const world = createWorld({
  container: document.getElementById('app')!,
  xrEnabled: true,
});

// Load from .hsplus files
await world.loadFile('/scenes/main.hsplus');
world.start();
```

**Declarative world config with `@world` trait:**

```hsplus
@world {
  backgroundColor: "#16213e"
  fog: { type: "linear", color: "#16213e", near: 10, far: 100 }
  shadows: "high"
  lighting: "outdoor"
  camera: { position: [0, 2, 10], fov: 60 }
}

orb#player @grabbable {
  position: [0, 1, 0]
  color: "#00ffff"
}
```

**Three loading patterns:**

```typescript
// 1. Load single file
await world.loadFile('/scenes/main.hsplus');

// 2. Auto-load index.hsplus from directory
await world.loadDirectory('/scenes/level1');

// 3. Load from config manifest
await world.loadConfig('/project/holoscript.config.hsplus');
```

---

## 🎮 VRChat Alpha

> **NEW!** Export HoloScript directly to VRChat worlds. Write once, deploy to VRChat.

```bash
npm install @holoscript/vrchat-export
```

```holoscript
// Define a VRChat-ready world
world#my_club @vrchat {
  spawn_point: [0, 0, 0]
  max_players: 32
  
  object#dance_floor @grabbable @synced {
    position: [0, 0, 0]
    material: "neon_tiles"
    on_step: trigger_lights()
  }
  
  npc#dj @talkable {
    dialog: "Welcome to the club!"
    animations: ["idle", "wave", "dance"]
  }
}
```

```bash
# Export to VRChat SDK
holoscript export --target vrchat my_world.hsplus

# Output: Unity project with Udon scripts ready for upload
```

**What's included:**
- ✅ Automatic Udon graph generation
- ✅ Synced object state (multiplayer-ready)
- ✅ Trait mapping (`@grabbable` → VRC_Pickup)
- ✅ NPC dialog system with voice support
- 🟡 Custom shaders (coming soon)
- 🟡 Avatar interactions (coming soon)

[📖 VRChat Export Guide](./docs/VRCHAT_EXPORT.md) | [🎥 Demo Video](#)

---

## 🧪 Experimental
| Package | Status | Description |
|---------|--------|-------------|
| `@holoscript/vrchat-export` | 🎮 **Alpha** | Compile HoloScript to VRChat Udon |
| `@holoscript/commerce` | 🧪 | In-world payments & inventory |
| `@holoscript/llm` | 🧪 | Local LLM inference bindings |

## Build with AI

```typescript
import { InfinityBuilderClient } from '@holoscript/infinityassistant';

const client = new InfinityBuilderClient({ 
  apiKey: process.env.INFINITY_BUILDER_API_KEY 
});

const result = await client.build("Create a login form");
console.log(result.holoScript); // Ready to deploy
```

## Deploy Targets

| Platform | Status |
|----------|--------|
| Web (React/Vue/Angular) | ✅ |
| WebXR (VR) | ✅ |
| WebAR | ✅ |
| React Native | ✅ |
| Flutter | 🟡 *coming soon* |
| iOS (SwiftUI) | 🟡 *coming soon* |
| Android (Jetpack) | 🟡 *coming soon* |
| Electron | ✅ |
| Tauri | 🟡 *coming soon* |

## Examples

```holoscript
// Interactive counter with VR support
component#counter @state { count: 0 } @grabbable {
  p { "Count: ${state.count}" }
  button { 
    text: "+"
    @on_click: () -> { state.count++ }
  }
  
  @on_grab: (hand) -> {
    haptics.pulse(hand, 0.5)
  }
}
```

```holoscript
// Shopping cart
component#cart @state { items: [] } {
  @for item in state.items {
    div.item { ${item.name} - $${item.price} }
  }
  div.total { "Total: $${state.items.reduce((a,b) => a + b.price, 0)}" }
}
```

```holoscript
// Scale magnitude - universe to atom
scale galactic {
  orb#sun { color: "#ffcc00", glow: true }
  orb#earth { position: [50, 0, 0] }
}

focus sun {
  scale atomic {
    orb#nucleus { color: "#ff0000" }
    orb#electron { position: [1, 0, 0], scale: 0.1 }
  }
}
```

## Ecosystem

- **[Hololand](https://github.com/brianonbased-dev/Hololand)** - VR/AR platform built on HoloScript
- **[Infinity Assistant](https://infinityassistant.io)** - AI-powered building and deployment

## CLI

```bash
npm install -g @holoscript/cli

holoscript run app.hs       # Run a file
holoscript parse app.hs     # Show AST
holoscript repl             # Interactive mode
```

## 🛠️ Tools

### VS Code Extension
The official **HoloScript** extension provides:
- Syntax highlighting for `.holo` and `.hsplus`
- IntelliSense for Traits (`@grabbable`, `@npc`)
- Snippets for common patterns

**Install**: Search "HoloScript" in VS Code Marketplace or install from `.vsix`.

## Contributing

MIT license. PRs welcome.

```bash
git clone https://github.com/brianonbased-dev/HoloScript.git
cd HoloScript
pnpm install
pnpm build
pnpm test
```

## License

MIT - Use it anywhere, for anything.

---

**Questions?** Open an issue or visit [infinityassistant.io](https://infinityassistant.io)
