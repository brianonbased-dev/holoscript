# HoloScript v3.4.0

**Write once. Run everywhere. Spatial computing for everyone.**

HoloScript is an AI-native, declarative language for spatial computing. It allows developers and AI agents to define interactive worlds, complex behaviors, and high-fidelity graphics that compile to 18+ platforms from a single source.

![version-badge](https://img.shields.io/badge/version-v3.4.0-green?style=for-the-badge)
![Quickstart Badge](https://img.shields.io/badge/Quickstart-5_min-blue?style=for-the-badge)
![Traits Badge](https://img.shields.io/badge/traits-1800+-orange?style=for-the-badge)

---

## 📦 Installation

Choose your preferred method:

### macOS (Homebrew)

```bash
brew tap brianonbased-dev/holoscript
brew install holoscript
```

### Windows (Chocolatey)

```bash
choco install holoscript
```

### npm (Cross-platform)

```bash
npm install -g @holoscript/cli
```

### Cargo (Rust)

```bash
cargo install holoscript-wasm
```

### Unity Package Manager

Add to your Unity project (2022.3+ or Unity 6):

```text
https://github.com/brianonbased-dev/HoloScript.git?path=/packages/unity-sdk
```

**[📘 Full Deployment Guide →](./DEPLOYMENT.md)**

---

## 🚀 Quick Start (30 Seconds)

1. **Install CLI** (see above)
2. **Create `hello.holo`:**

```holo
composition "Hello Holo" {
  object "Cube" {
    @grabbable
    @physics
    geometry: "box"
    position: [0, 1, 0]
  }
}
```

3. **Preview:** `holoscript preview hello.holo`

**[View Full 5-Minute Tutorial →](./docs/getting-started/quickstart.md)**

---

## 🔥 Key Features

- ✅ **1,800+ VR Traits** - `@grabbable`, `@physics`, `@ai_agent`, `@teleport`, 213 robotics/industrial traits, 24 scientific computing traits, and more.
- ✅ **600+ Visual Traits** - PBR materials, procedural textures, and mood-based lighting.
- ✅ **50+ Core Modules** - AI, physics, ECS, animation, audio, terrain, particles, networking, editor, and more.
- ✅ **18 Compile Targets** - VRChat, Unreal Engine, iOS/ARKit, Android/ARCore, Unity, WebAssembly, and more.
- ✅ **AI-Native** - Built for LLMs with 34 high-level MCP tools for real-time generation.
- ✅ **Scientific Computing** - Molecular dynamics, drug discovery, and AutoDock Vina integration via `@holoscript/narupa-plugin`.
- ✅ **Robotics & Industrial** - URDF/USD/SDF/MJCF export with 213 declarative traits for joints, actuators, sensors, and control systems.
- ✅ **Production-Ready Runtime** - Resilience patterns, CRDT state, reactive state, WebGPU rendering, and WebXR session management.

---

## 🏗️ 18+ Compile Targets

| Platform         | Target                                        | Support   |
| ---------------- | --------------------------------------------- | --------- |
| **VR Platforms** | VRChat (Udon), Quest (OpenXR), SteamVR        | ✅ Stable |
| **Game Engines** | Unreal Engine 5, Unity, Godot                 | ✅ Stable |
| **Mobile AR**    | iOS (ARKit), Android (ARCore), Vision Pro     | ✅ Stable |
| **Web**          | React Three Fiber, WebGPU, WebAssembly        | ✅ Stable |
| **Advanced**     | Robotics (URDF), Digital Twins (DTDL), Gazebo | ✅ Stable |

---

## 📚 Documentation

- 📗 **[Quickstart](./docs/getting-started/quickstart.md)** - Start building in minutes.
- 📘 **[Traits Reference](./docs/TRAITS_REFERENCE.md)** - Explore the massive library of 1,800+ VR traits.
- 📙 **[Academy](./docs/academy/README.md)** - Master HoloScript through interactive lessons.
- 📕 **[Troubleshooting](./docs/guides/troubleshooting.md)** - Solutions to common issues.
- 🔘 **[Architecture](./docs/architecture/README.md)** - Deep dive into the engine and compiler.

---

## 🛠️ Tooling

- **HoloScript Studio** - AI-powered 3D scene builder with templates (Enchanted Forest, Space Station, Art Gallery, Zen Garden, Neon City).
- **Plugin System** - Sandboxed plugin API with PluginLoader, ModRegistry, and permission-based asset/event access.
- **VS Code Extension** - Syntax highlighting and trait IntelliSense.
- **MCP Server** - Give your AI agents the power to build spatial worlds.
- **HoloScript CLI** - Parse, validate, and compile from your terminal.

### Companion Repositories

| Repository | Description | Version |
| --- | --- | --- |
| [`holoscript-compiler`](https://github.com/brianonbased-dev/holoscript-compiler) | Standalone `.hsplus` → USD/URDF/SDF/MJCF compiler for robotics (NVIDIA Isaac Sim) | v0.1.0 |
| [`holoscript-scientific-plugin`](https://github.com/brianonbased-dev/holoscript-scientific-plugin) | Narupa molecular dynamics + VR drug discovery plugin | v1.2.0 |

---

## � New in v3.4: Scientific Computing & Robotics

### Scientific Computing (24 traits)

HoloScript now supports VR-based drug discovery and molecular dynamics through `@holoscript/narupa-plugin`:

```holo
composition "Drug Discovery Lab" {
  object "Protein" {
    @protein_visualization
    @pdb_loader(file: "1ubq.pdb")
    @hydrogen_bonds
    @electrostatic_surface
  }

  object "Ligand" {
    @ligand_visualization
    @auto_dock(receptor: "Protein")
    @interactive_forces
    @binding_affinity
  }
}
```

### Robotics & Industrial (213 traits)

Declarative robot authoring with export to URDF, USD, SDF, and MJCF:

```holo
composition "Robot Arm" {
  object "Joint1" {
    @joint_revolute
    @position_controlled
    @harmonic_drive
    @force_torque_sensor
    @joint_safety_controller
  }
}
```

---

## �🤝 Contributing

HoloScript is **MIT licensed** and open-source. We welcome contributions to the core engine, compilers, and documentation.

```bash
git clone https://github.com/brianonbased-dev/HoloScript.git
cd HoloScript
pnpm install
pnpm test
```

---

[Website](https://holoscript.dev) | [Discord](https://discord.gg/holoscript) | [Twitter](https://twitter.com/holoscript)

© 2026 HoloScript Foundation.
