# HoloScript 3.0.0 Release Notes

**Release Date:** February 6, 2026

## 🎉 Overview

HoloScript 3.0 is a major release that transforms HoloScript into a truly universal VR/AR development language. With 18 compile targets, WASM support, and comprehensive ecosystem tooling, you can now write once and deploy everywhere.

## ✨ Highlights

### 18 Compile Targets

Write HoloScript once, compile to:

| Platform | Target | Status |
|----------|--------|--------|
| Three.js | `threejs` | ✅ Stable |
| Unity | `unity` | ✅ Stable |
| VRChat | `vrchat` | ✅ New |
| Babylon.js | `babylon` | ✅ Stable |
| A-Frame | `aframe` | ✅ Stable |
| WebXR | `webxr` | ✅ Stable |
| URDF | `urdf` | ✅ Stable |
| SDF | `sdf` | ✅ Stable |
| DTDL | `dtdl` | ✅ Stable |
| WebAssembly | `wasm` | ✅ Stable |
| Unreal Engine 5 | `unreal` | ✅ New |
| iOS/ARKit | `ios` | ✅ New |
| Android/ARCore | `android` | ✅ New |
| Godot 4 | `godot` | ✅ New |
| visionOS | `visionos` | ✅ New |
| OpenXR | `openxr` | ✅ New |
| Android XR | `androidxr` | ✅ New |
| WebGPU | `webgpu` | ✅ New |

### New Platform Compilers

- **VRChatCompiler** - Generate UdonSharp scripts with VRC_Pickup, VRC_ObjectSync, mirrors, portals
- **UnrealCompiler** - Generate C++ actors with UPROPERTY/UFUNCTION macros and Blueprint support
- **IOSCompiler** - Generate Swift/SwiftUI with ARKit integration
- **AndroidCompiler** - Generate Kotlin with ARCore and Jetpack Compose

### Editor Support

- **VS Code Extension** - Syntax highlighting, LSP, snippets
- **IntelliJ Plugin** - Full IDE support
- **Neovim Plugin** - Tree-sitter highlighting, LSP integration (NEW)

## 📦 New Features

### WebAssembly Compilation
```bash
holoscript compile scene.holo --target wasm
```
Generates WAT format with JavaScript bindings and TypeScript types.

### Certified Packages Program
- Automated quality verification across 4 categories
- Letter grades (A-F) with certification badges
- One-year validity with certificate IDs

### Partner SDK
- `@holoscript/partner-sdk` for ecosystem integration
- Registry API client
- Webhook handlers for package events
- Analytics dashboard

### Team Workspaces
- Collaborative environments with role-based access
- Shared secrets management
- Activity logging and audit trail

### HoloScript Academy
- 30+ lessons across 3 learning levels
- Interactive tutorials
- Certificate tracking

## 🚀 Performance

| Benchmark | Result |
|-----------|--------|
| Parse small (100 lines) | 32,456 ops/s |
| Parse medium (600 lines) | 3,440 ops/s |
| Parse large (1200 lines) | 2,367 ops/s |
| Full compile (fresh) | 2.4M ops/s |
| Incremental compile | 1.7M ops/s |

## 🔧 Breaking Changes

### CLI Changes
- Compile target names are now lowercase: `--target vrchat` instead of `--target VRChat`
- WASM output structure changed to include separate bindings file

### API Changes
- `HoloParser.parse()` now returns `{ success, composition, errors }` instead of just AST
- Trait validators moved to `@holoscript/traits` package

## 📖 Migration Guide

See [MIGRATION_GUIDE_3.0.md](docs/MIGRATION_GUIDE_3.0.md) for detailed upgrade instructions.

## 🙏 Contributors

Thanks to all contributors who made this release possible!

## 📄 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete list of changes.

---

**Getting Started:**
```bash
npm install -g @holoscript/cli
holoscript init my-project
holoscript compile scene.holo --target threejs
```

**Links:**
- [Documentation](https://holoscript.dev/docs)
- [GitHub](https://github.com/brianonbased-dev/Holoscript)
- [Discord](https://discord.gg/holoscript)
- [npm](https://www.npmjs.com/package/@holoscript/core)
