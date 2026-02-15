## [3.4.0] - 2026-02-15

### 🚀 HoloScript 3.4 - Scientific Computing, Robotics & Full Runtime Engine

This release adds 287 new source modules, 113 test suites, and expands the trait system to 1,800+ traits with new scientific computing, robotics/industrial, and comprehensive runtime subsystems.

### Added

#### Scientific Computing & Molecular Dynamics (24 traits)

- **Narupa Integration** - Connect to Narupa MD servers for VR-based molecular dynamics
- **Auto-Dock** - Automated molecular docking via AutoDock Vina integration
- **Database Query** - Fetch structures from RCSB PDB and AlphaFold DB
- **Molecular Visualization** - Protein rendering, ligand visualization, chemical bonds, hydrogen bonds, hydrophobic/electrostatic surfaces
- **Trajectory Analysis** - MD trajectory playback and binding affinity calculations
- **Interactive Forces** - Apply VR controller forces to atoms in real-time
- Integration: `@holoscript/narupa-plugin v1.0.0+`

#### Robotics & Industrial Traits (213 traits)

- **Joint System** (42) - Revolute, prismatic, continuous, fixed, planar, floating, ball joints with control modes, transmissions, and safety controllers
- **Actuators & Motors** (28) - DC, BLDC, stepper, servo, pneumatic, hydraulic with feedback and force/torque sensing
- **Sensors** (36) - Vision, range sensing, IMU, environmental, and force/torque
- **End Effectors** (22) - Grippers, tool interfaces, and specialized tools
- **Mobility** (20) - Mobile bases, legged locomotion, aerial, and aquatic platforms
- **Control & Planning** (25) - PID, MPC, impedance control, motion planning, path planning
- **Safety & Standards** (22) - Emergency stop, safety zones, ISO 10218, CE marking
- **Power & Communication** (18) - Battery, solar, ROS2, CAN bus, EtherCAT
- Export targets: URDF, USD, SDF, MJCF

#### AI & Behavior Systems (11 modules)

- **AICopilot** - AI-assisted scene editing and code generation
- **BehaviorTree** - Full behavior tree implementation with BTNodes
- **StateMachine** - Finite state machines for entity AI
- **GoalPlanner** - GOAP-style goal-oriented action planning
- **UtilityAI** - Utility-based AI decision-making
- **SteeringBehaviors** - Flocking, pursue, evade, wander
- **PerceptionSystem** - Sight, hearing, proximity detection
- **InfluenceMap** - Spatial influence maps for tactical AI
- **Blackboard** - Shared AI knowledge base
- **BehaviorSelector** - Priority-based behavior arbitration

#### Physics & Simulation (15 modules)

- **SoftBodySolver / SoftBodyAdapter** - Soft body physics simulation
- **ClothSim** - Cloth simulation with wind and collisions
- **FluidSim** - Particle-based fluid dynamics
- **RopeSystem** - Rope and cable physics
- **RagdollController / RagdollSystem** - Full ragdoll physics
- **JointSystem** - Configurable physics joints
- **VehicleSystem** - Vehicle physics simulation
- **DeformableMesh** - Mesh deformation
- **ConstraintSolver** - Physics constraint resolution
- **SpatialHash** - Broadphase collision detection
- **TriggerZone** - Volume-based event triggers
- **RaycastSystem** - GPU-accelerated raycasting
- **VRPhysicsBridge** - VR controller ↔ physics integration

#### Audio Engine (15 modules)

- **AudioEngine** - Core audio processing pipeline
- **AudioMixer** - Multi-channel mixing with send/return
- **SpatialAudioSource / SpatialAudioZone** - 3D positional audio
- **AudioAnalyzer** - FFT analysis and beat detection
- **AudioFilter** - Parametric EQ, low/high pass
- **AudioGraph** - Node-based audio routing
- **AudioOcclusion** - Physics-based sound occlusion
- **SynthEngine** - Procedural sound synthesis
- **MusicGenerator** - Algorithmic music generation
- **SoundPool** - Efficient sound pooling

#### Animation System (13 modules)

- **AnimationGraph** - State-based animation blending
- **IK System** - Inverse kinematics for characters
- **SkeletalAnimation** - Bone-based animation
- **AnimationClip** - Clip management and sequencing
- **Spline** - Spline-based motion paths
- **Cinematic** - Camera tracks and cutscenes

#### Entity Component System (5 modules)

- **ECS Core** - Archetype-based entity component system
- **ReactiveECS** - Reactive query system for components
- **SystemIntegrator** - System registration and execution order

#### Editor & Tooling (15 modules)

- **EditorCore** - Scene hierarchy, selection, gizmos
- **Inspector** - Property inspector with undo/redo
- **NodeGraph** - Visual scripting node editor
- **History** - Multi-level undo/redo with branching

#### Networking & Multiplayer (18 modules)

- **NetworkManager** - Connection management and authority
- **Matchmaker / LobbyManager / RoomManager** - Session management
- **AntiCheat** - Server-side validation
- **SyncTrait** - Automatic property synchronization
- **NetworkPredictor** - Client-side prediction and reconciliation

#### Rendering Pipeline (15 modules)

- **WebGPU Renderer** - Modern GPU rendering pipeline
- **PostProcess** - Bloom, SSAO, tonemap, DOF
- **Shaders** - Custom shader pipeline
- **SplatRenderer** - Gaussian splat rendering (WGSL)
- **LOD System** - Level-of-detail with impostors and streaming
- **Decals** - Runtime decal projection

#### Terrain & Environment (15 modules)

- **Terrain System** - Heightmap-based terrain with LOD
- **Foliage** - Procedural foliage placement and wind
- **Weather** - Dynamic weather system
- **World Streaming** - Seamless world loading

#### Additional Systems

- **Persistence** (6) - Save/load, scene serialization, migration
- **Gameplay** (9) - Quest, inventory, combat, dialogue, achievements
- **UI** (5) - Spatial UI, tactile interfaces, theming
- **Procedural Generation** (3) - Terrain, dungeons, vegetation
- **Accessibility** (3) - Screen reader, color blindness, input remapping
- **Plugins** (3) - Plugin loader, lifecycle, sandboxing
- **LSP** (3) - Completion, diagnostics, language service
- **Replay** (3) - Recording and playback system

#### New Trait Implementations

- **GrabbableTrait** - Full grab lifecycle with snapping
- **VisionTrait** - AI vision with raycasting
- **VoiceMeshTrait** - Voice-reactive mesh deformation
- **NeuralForgeTrait** - Neural network training in VR
- **NPCAITrait** - Autonomous NPC behaviors
- **GestureTrait** - Hand gesture recognition
- **HandMenuTrait** - Palm-anchored menus
- **VolumetricTrait** - Volumetric rendering
- **PressableTrait / SlidableTrait / ScrollableTrait** - Spatial UI input
- **BlackboardTrait** - AI knowledge sharing

#### Production Infrastructure

- **ResiliencePatterns** - Circuit breaker, retry, bulkhead, timeout, fallback
- **CRDT State Manager** - Conflict-free replicated data types
- **ReactiveState** - Observable state with computed properties
- **Production Deployment Guide** - Comprehensive deployment documentation

#### Test Coverage

- 113 new test suites covering all major subsystems
- Test categories: AI, physics, audio, animation, ECS, editor, multiplayer, persistence, UI, gameplay

### Changed

- Updated trait count from 1,525 to 1,800+ (68 trait module files)
- Enhanced MCP server with new tool handlers
- Improved WebGPU renderer with physics debug drawing
- Updated HITL manager with comprehensive test coverage
- Improved movement prediction with full lookahead
- Enhanced CRDT state conflict resolution

---

## [Unreleased]

### Added

#### Trait Visual System (Feb 2026)

- **TraitVisualRegistry** — Singleton registry mapping 600+ trait names to PBR material configs
  - 23 preset categories: material-properties, surface-texture, lighting, gems-minerals, fabric-cloth, visual-effects, age-condition, water-fluid, weather-phenomena, emotion-mood, size-scale, environmental-biome, magic-fantasy, scifi-technology, creatures-mythical, nature-life, furniture-decor, construction-building, containers-storage, shape-form, animals, maritime-naval, time-period
  - Auto-registration on import via barrel `packages/core/src/traits/visual/index.ts`
- **TraitCompositor** — 9-layer priority merge engine for multi-trait visual composition
  - Layer ordering: base_material → surface → condition → physical → scale → lighting → visual_effect → environmental → mood
  - Composition rules: requirements, suppression, additive, and multi-trait merge
- **AssetResolverPipeline** — Plugin-based asset resolution (cache → procedural → AI → PBR fallback)
  - `CacheManager` with LRU eviction and configurable memory limits
  - `ProceduralResolver` for noise-based texture generation (wood grain, marble, voronoi, rust)
  - `TextureResolver` adapter for AI text-to-texture services
- **R3FCompiler integration** — Catch-all block now queries TraitVisualRegistry for material props
- **70-test suite** covering all visual system components

#### Deployment Infrastructure (Feb 2026)

- **Cargo Workspace** — Unified Rust package management with version inheritance
  - Workspace members: `compiler-wasm`, `holoscript-component` (disabled pending WIT config)
  - Shared dependencies and metadata across all Rust packages
  - `workspace.package` version inheritance for atomic versioning
- **Multi-Platform Release Workflow** — GitHub Actions workflow for 4 platforms
  - Native builds for: win32 (x86_64-pc-windows-msvc), darwin-x64, darwin-arm64, linux
  - Automated release artifact generation and GitHub release creation
  - Cross-platform compilation with platform-specific Rust toolchains
- **Homebrew Formula** — macOS package manager integration
  - Universal binary support (ARM64 + Intel)
  - Formula location: `Formula/holoscript.rb`
  - Installation: `brew tap brianonbased-dev/holoscript && brew install holoscript`
- **Chocolatey Package** — Windows package manager integration
  - NuGet package specification with PowerShell install scripts
  - Location: `chocolatey/holoscript.nuspec`
  - Installation: `choco install holoscript`
- **Version Synchronization** — Atomic version bumping across 6 package managers
  - Script: `scripts/sync-versions.js` (patch, minor, major, prerelease)
  - Synchronized files: package.json, Cargo.toml, Unity package.json, Homebrew formula, Chocolatey nuspec, README badges
  - NPM scripts: `pnpm version:patch`, `pnpm version:minor`, `pnpm version:major`
- **Typeshare Integration** — Automatic Rust→TypeScript type generation
  - `#[typeshare]` annotations on Rust structs and enums
  - Generated types location: `packages/compiler-wasm/bindings/`
  - Build scripts: `pnpm types:generate` (bash), `pnpm types:generate:win` (PowerShell)

#### Unity SDK Improvements (Feb 2026)

- **Assembly Definitions** — Namespace isolation (Pattern G.010.01)
  - `HoloScript.Runtime.asmdef` — Runtime components and trait system
  - `HoloScript.Editor.asmdef` — Editor-only importers and inspectors
  - `HoloScript.Runtime.Tests.asmdef` — Runtime unit tests
  - `HoloScript.Editor.Tests.asmdef` — Editor unit tests
- **Comprehensive Test Suite** — 24 unit tests across Runtime and Editor
  - Runtime tests: HoloScriptObject trait application, component mapping
  - Editor tests: Asset importer, material parsing, transform hierarchy
  - XR Interaction Toolkit integration tests for VR traits
- **Unity Package Manager** — Git URL-based installation
  - URL: `https://github.com/brianonbased-dev/HoloScript.git?path=/packages/unity-sdk`
  - Version constraints: Unity 2022.3 LTS or Unity 6+
  - Dependencies: XR Interaction Toolkit 2.3+

#### Build & CI Optimization (Feb 2026)

- **82% Build Time Reduction** — CI/CD optimizations (15 min → 2.7 min)
  - Swatinem/rust-cache@v2 — Incremental Rust dependency caching (55% reduction)
  - jetli/wasm-pack-action@v0.4.0 — Pre-built wasm-pack binary (5-7 min savings)
  - Shared cache key: "holoscript-v1" with `cache-all-crates: true`
- **Parallel Test Execution** — Vitest concurrency optimization
- **Railway Deployment** — Cloud platform auto-deployment
  - Removed prebuild hook (typeshare now manual via `pnpm types:generate`)
  - Zero-config deployment with automatic Node.js detection

#### Documentation (Feb 2026)

- **DEPLOYMENT.md** — 534-line comprehensive deployment guide
  - 15 deployment channels covered (Homebrew, Chocolatey, npm, Cargo, Unity, etc.)
  - Multi-platform release workflow documentation
  - Version management best practices
  - CI/CD pipeline architecture
  - Troubleshooting guides for each platform
  - Release checklist and rollback procedures
- **README.md** — Multi-channel installation section
  - Quick-start installation for macOS (Homebrew), Windows (Chocolatey), npm, Cargo, Unity
  - Platform-specific instructions with command examples
  - Version badges and quickstart links
- **Unity SDK CHANGELOG** — v3.0.0 release notes
  - Migration guides from 2.5.x to 3.0.0
  - Unity 2021 to 2022 migration path
  - Breaking changes and deprecation notices
- **CI/CD Architecture Docs** — Build optimization strategies
- **Type Generation Guides** — Typeshare usage and workflows
- **Package Manager Guides** — Publishing to Homebrew, Chocolatey, npm, Cargo

#### VR Traits Modularization (Feb 2026)

- Modularized 1,525 VR traits from monolithic `constants.ts` into 61 category-per-file modules
- Barrel index with `as const` tuple spreading for type-safe trait names

#### New Platform Compilers

- **VRChatCompiler** - Compile to VRChat SDK3 worlds with UdonSharp scripts
  - VRC_Pickup, VRC_Trigger, VRC_ObjectSync components
  - Avatar pedestals, mirrors, portals
  - Spatial audio with VRC_SpatialAudioSource
  - CLI: `holoscript compile --target vrchat`

- **UnrealCompiler** - Compile to Unreal Engine 5 C++ / Blueprint
  - AActor-derived C++ classes with UPROPERTY/UFUNCTION macros
  - Enhanced Input for VR interactions
  - Niagara particle system integration
  - CLI: `holoscript compile --target unreal`

- **IOSCompiler** - Compile to iOS Swift/ARKit
  - SwiftUI + ARKit integration with ARSCNView
  - Plane detection and hit testing
  - World tracking configuration
  - Gesture recognizers for interaction
  - CLI: `holoscript compile --target ios`

- **AndroidCompiler** - Compile to Android Kotlin/ARCore
  - Kotlin Activity with ARCore Session
  - Sceneform / Filament rendering support
  - Jetpack Compose UI integration
  - Touch gesture handling
  - CLI: `holoscript compile --target android`

#### Additional Compile Targets

- **GodotCompiler** - CLI: `holoscript compile --target godot`
- **VisionOSCompiler** - CLI: `holoscript compile --target visionos`
- **OpenXRCompiler** - CLI: `holoscript compile --target openxr`
- **AndroidXRCompiler** - CLI: `holoscript compile --target androidxr`
- **WebGPUCompiler** - CLI: `holoscript compile --target webgpu`

#### Editor Support

- **Neovim Plugin** - Native Neovim support with Tree-sitter
  - Syntax highlighting for .hs, .hsplus, .holo files
  - LSP integration for completions and diagnostics
  - Custom commands and keybindings
  - Located in `packages/neovim-plugin/`

### Changed

- Updated CLI `compile` command to support all 18 compile targets
- Added 71 unit tests for new VRChat, Unreal, iOS, and Android compilers

---

## [3.0.0] - 2026-02-05

### 🎉 HoloScript 3.0 - Major Release

This is a major release bringing WASM compilation, certified packages, partner SDK, and comprehensive ecosystem tooling.

### Added

#### Embedded Runtime & Game Engine Adapters (Sprint 9-10)

- **HoloScriptRuntime** - Embeddable runtime for partner applications
  - Scene loading and management
  - Plugin system for custom extensions
  - Event-driven architecture
- **UnityAdapter** - Generate C# scripts and prefabs for Unity
- **UnrealAdapter** - Generate C++ actors and Blueprints for Unreal Engine
- **GodotAdapter** - Generate GDScript and .tscn scenes for Godot
- **BrandingKit** - Partner branding assets (badges, colors, typography)

#### WASM Compilation (Sprint 3)

- **WebAssembly Target** - Compile HoloScript to WAT format
- JavaScript bindings generation with TypeScript types
- Memory layout management (state, objects, events, strings)
- Optional SIMD and thread support
- CLI: `holoscript compile --target wasm`

#### Certified Packages Program (Sprint 9-10)

- **CertificationChecker** - Automated package quality verification
- Checks across 4 categories: code quality, documentation, security, maintenance
- Letter grades (A-F) based on comprehensive scoring
- **BadgeGenerator** - Create certification badges (SVG, Markdown, HTML, JSON)
- One-year certification validity with certificate IDs

#### Partner SDK (Sprint 9-10)

- **@holoscript/partner-sdk** - Full ecosystem integration SDK
- **RegistryClient** - Programmatic registry access
- **WebhookHandler** - Event processing for package/version/certification events
- **PartnerAnalytics** - Download stats, engagement metrics, health scores
- Express/Koa middleware support
- Rate limiting and retry handling

#### Team Workspaces (Sprint 8)

- **WorkspaceManager** - Collaborative environments
- Role-based access control (Owner, Admin, Developer, Viewer)
- Shared secrets management
- Activity logging and audit trail
- CLI commands: `holoscript workspace create/invite/secret`

#### HoloScript Academy (Sprint 8)

- 10 lessons (Level 1: Fundamentals)
- Levels 2-3 planned
- Hands-on exercises and projects

#### Visual Scripting (Sprint 7)

- Node-based visual programming
- 26 node types (event, action, logic, data)
- Real-time preview
- Export to HoloScript code

#### Enhanced LSP Autocomplete (Sprint 7)

- Context-aware code completion via LSP
- Trait and property inference

#### IntelliJ Plugin (Sprint 7)

- Full JetBrains IDE support
- Syntax highlighting
- Code completion
- Error checking

#### VS Code Extension Enhancements (Sprint 2)

- Semantic token highlighting
- 72 code snippets
- Inline error diagnostics
- Quick fixes

#### Dead Code Detection (Sprint 5)

- Find unused functions, variables, imports
- Configurable detection rules

#### Deprecation Warnings (Sprint 5)

- Linter rules for deprecated APIs
- Migration suggestions

#### Migration Assistant (Sprint 5)

- Automated version migration
- Code transformation rules
- Detailed migration reports

#### Complexity Metrics (Sprint 5)

- Cyclomatic complexity
- Cognitive complexity
- Maintainability index

#### Package Registry MVP (Sprint 5)

- Scoped packages (@org/name)
- Semantic versioning
- Dependency resolution

### Changed

- Minimum Node.js version: 18.0.0
- TypeScript 5.0+ required
- `parse()` now returns `HSPlusAST` format
- `@networked` trait config restructured
- Improved error messages with suggestions

### Deprecated

- `@legacy_physics` trait - use `@physics` instead
- `compile({ format: 'cjs' })` - CommonJS output
- `HoloScriptParser` class - use `HoloScriptPlusParser`

### Performance

- 50% faster parsing with incremental parsing
- 3x faster rebuilds with compilation caching
- Reduced memory usage in large projects
- Parallel compilation for multi-file projects

### Fixed

- Spread operator in nested objects
- Trait dependency resolution cycles
- Source map generation for complex expressions
- LSP crash on malformed input
- MQTT reconnection handling
- Workspace permission inheritance
- HeadlessRuntime state provider timing race condition
- WorkspaceRepository type signature for partial settings updates
- Visual regression tests gracefully skip when browser unavailable
- holoscript package test script runs in CI mode (not watch mode)

---

## [2.5.0] - 2026-02-05

### 🚀 Package Publishing & Access Control (Sprint 6)

Full package publishing and registry integration with access control.

### Added

#### Package Publishing

- **`holoscript publish`** - Publish packages to HoloScript registry
  - Pre-publish validations (package.json, README, LICENSE, semver)
  - Tarball packaging with USTAR format and gzip compression
  - `--dry-run` - Preview without uploading
  - `--tag <tag>` - Version tag (default: "latest")
  - `--access <level>` - public or restricted
  - `--force` - Publish with warnings
  - `--otp <code>` - 2FA one-time password

#### Authentication

- **`holoscript login`** - Log in to HoloScript registry
- **`holoscript logout`** - Log out from registry
- **`holoscript whoami`** - Display current logged-in user

#### Access Control

- **`holoscript access grant <pkg> <user>`** - Grant access to a package
- **`holoscript access revoke <pkg> <user>`** - Revoke access
- **`holoscript access list <pkg>`** - List package access

#### Organization Management

- **`holoscript org create <name>`** - Create an organization
- **`holoscript org add-member <org> <user>`** - Add member with role
- **`holoscript org remove-member <org> <user>`** - Remove member
- **`holoscript org list-members <org>`** - List organization members

#### Token Management

- **`holoscript token create`** - Create API token for CI/CD
- **`holoscript token revoke <id>`** - Revoke a token
- **`holoscript token list`** - List your tokens
- Token options: `--name`, `--readonly`, `--scope`, `--expires`

### Changed

- Updated all package versions to 2.5.0
- Unified CLI help text with comprehensive examples for all commands

---

## [2.2.1] - 2026-02-05

### 🤖 Grok/X Integration

Enable Grok (xAI) to build, validate, and share HoloScript VR scenes directly in X conversations.

### Added

- **MCP Server** (`@holoscript/mcp-server@1.0.1`) - Full Model Context Protocol server with 16 tools for AI agents
- **Python Bindings** (`pip install holoscript`) - Python package for Grok's execution environment
- **Render Service** (`services/render-service/`) - Preview generation and X sharing endpoints
- **Browser Templates** (`examples/browser-templates/`) - Pre-built HTML templates for instant scene rendering
- **Social Traits** - 3 new traits: `@shareable`, `@collaborative`, `@tweetable`

### MCP Tools

| Tool                                 | Purpose                 |
| ------------------------------------ | ----------------------- |
| `parse_hs` / `parse_holo`            | Parse HoloScript files  |
| `validate_holoscript`                | AI-friendly validation  |
| `generate_object` / `generate_scene` | Natural language → code |
| `list_traits` / `explain_trait`      | Trait documentation     |
| `render_preview`                     | Generate preview images |
| `create_share_link`                  | X-optimized share links |

### Python Usage

```python
from holoscript import HoloScript

hs = HoloScript()
scene = hs.generate("forest with glowing mushrooms")
share = hs.share(scene.code, platform="x")
print(share.playground_url)
```

### Links

- npm: https://www.npmjs.com/package/@holoscript/mcp-server
- PyPI: https://pypi.org/project/holoscript/
- Docs: [Grok/X Integration Guide](./docs/GROK_X_IMPLEMENTATION_SUMMARY.md)

---

## [2.2.0] - 2026-01-31

### 🎮 Brittney AI Game Generation Features

Major addition of game development constructs for Brittney AI content generation:

### Added

- **7 New Language Constructs** - RPG and game content definition blocks:
  - `npc "name" { }` - NPC Behavior Trees with types, models, and dialogue references
  - `quest "name" { }` - Quest Definition System with objectives, rewards, and branching
  - `ability "name" { }` - Ability/Spell definitions with class requirements and levels
  - `dialogue "id" { }` - Dialogue Trees with character, emotion, content, and options
  - `state_machine "name" { }` - State Machines for boss phases and complex behaviors
  - `achievement "name" { }` - Achievement System with points and hidden unlocks
  - `talent_tree "name" { }` - Talent Trees with tiers, nodes, and dependency chains

- **New AST Types** - Full type definitions for all game constructs:
  - `HoloNPC`, `HoloBehavior`, `HoloBehaviorAction`
  - `HoloQuest`, `HoloQuestObjective`, `HoloQuestRewards`, `HoloQuestBranch`
  - `HoloAbility`, `HoloAbilityStats`
  - `HoloDialogue`, `HoloDialogueOption`
  - `HoloStateMachine`, `HoloState_Machine`
  - `HoloAchievement`
  - `HoloTalentTree`, `HoloTalentRow`, `HoloTalentNode`

- **Brittney Training Data** - Examples for AI fine-tuning:
  - `brittney-features-examples.hsplus` - 8 comprehensive HoloScript examples
  - `brittney-features-training.jsonl` - 20 prompt/completion pairs

### Changed

- Parser now supports 46 tests (12 new Brittney feature tests)
- HoloComposition interface extended with: `npcs`, `quests`, `abilities`, `dialogues`, `stateMachines`, `achievements`, `talentTrees` arrays

### Example

```hsplus
composition "Starting Village" {
  npc "Elder Aldric" {
    npc_type: "quest_giver"
    dialogue_tree: "elder_intro"
  }

  quest "Goblin Menace" {
    giver: "Elder Aldric"
    level: 1
    type: "defeat"
    objectives: [
      { id: "defeat_goblins", type: "defeat", target: "goblin", count: 10 }
    ]
    rewards: { experience: 500, gold: 100 }
  }

  dialogue "elder_intro" {
    character: "Elder Aldric"
    emotion: "friendly"
    content: "Welcome, traveler. These are troubling times..."
    options: [
      { text: "What troubles the village?", next: "elder_troubles" }
    ]
  }

  achievement "Village Hero" {
    description: "Complete the Goblin Menace quest"
    points: 50
  }
}
```

---

## [2.1.1] - 2026-01-28

### 🔧 Parser Enhancements

Major HoloScript+ parser improvements for semantic scene descriptions:

### Added

- **16 Structural Directives** - Scene-level metadata and configuration
  - `@manifest` - Scene manifest with title, version, author
  - `@semantic` - Semantic description blocks
  - `@world_metadata` - World-level settings (theme, mood, time_of_day)
  - `@zones` - Named spatial zones with purposes
  - `@spawn_points` - Player spawn locations
  - `@skybox` - Skybox configuration (preset, time, clouds)
  - `@ambient_light` - Global ambient lighting
  - `@directional_light` - Sun/moon directional lights
  - `@fog` - Volumetric fog settings
  - `@post_processing` - Post-process effects
  - `@audio_zones` - 3D audio regions
  - `@navigation` - NavMesh configuration
  - `@physics_world` - Physics simulation settings
  - `@network_config` - Multiplayer networking
  - `@performance` - LOD and culling hints
  - `@accessibility` - A11y configuration

- **8 Simple Traits** - Concise object behavior modifiers
  - `@animated` - Mark objects for animation
  - `@billboard` - Always face camera
  - `@rotating` - Continuous rotation
  - `@collidable` - Physics collision
  - `@clickable` - Click interaction
  - `@glowing` - Emissive glow effect
  - `@interactive` - General interactivity
  - `@lod` - Level of detail switching

- **Logic Block Parsing** - Embedded scripting support
  - Function definitions with parameters
  - `on_tick` handlers for frame updates
  - `on_scene_load` initialization handlers
  - Event handlers for interactions

- **Template System** - Reusable object definitions
  - Named template blocks (`template "Name" { ... }`)
  - `using` syntax for template instantiation
  - Property overrides on instantiation

- **Environment Block** - Scene-wide lighting and atmosphere
  - Lighting directives within environment blocks
  - Skybox and fog configuration
  - Ambient and directional light settings

### Fixed

- Child node parsing for `logic`, `template`, `environment` blocks
  - Blocks now correctly parsed as children instead of properties
  - Fixed disambiguation between `logic: value` and `logic { ... }`

### Changed

- Parser now supports 687 tests (up from 679)
- Removed 3 outdated todo tests (features implemented in new parser)
- Unskipped 4 `parseObjectLiteral` tests

---

## [1.3.0] - 2026-01-26 (VS Code Extension)

### 🎓 Onboarding & Walkthrough

- **Getting Started Walkthrough** - 6-step interactive walkthrough for new users
  - Welcome to HoloScript introduction
  - Create Your First Scene guide
  - VR Traits tutorial (@grabbable, @physics, etc.)
  - Preview & Shortcuts documentation
  - AI Integration with MCP servers
  - Next Steps & Resources

- **Progressive Quickstart Examples** - 5 examples from basics to full games
  - `hello.holo` - Simple compositor, one interactive object
  - `2-interactive.holo` - VR traits, physics, interactions
  - `3-physics-playground.holo` - Templates, spatial audio
  - `4-multiplayer-room.holo` - Networking, player tracking
  - `5-escape-room.holo` - Complete puzzle game with UI

- **Welcome Message** - First-activation greeting with quick actions
- **New Commands** - Open Examples, Show Walkthrough, Open Documentation

---

## [2.2.0] - 2026-01-25

### 🚀 VR Runtime Packages

Three major new packages for building production VR experiences:

### Added

- **Spatial audio traits** - `@spatial_audio`, `@reverb_zone`, `@voice_proximity` in `@holoscript/runtime`
- **Debug Scripts** - Parser debugging utilities in `/scripts/`
- **AI Assistant Configuration** - Claude Desktop and Copilot integration

---

## [2.1.0] - 2026-01-22

### 🏗️ Repository Reorganization

Major structural change: HoloScript is now the dedicated language repository, separate from Hololand platform.

### Added

- **Dev Tools** - Consolidated all language tooling in this repo:
  - `@holoscript/formatter` - Code formatting (from Hololand)
  - `@holoscript/linter` - Static analysis (from Hololand)
  - `@holoscript/lsp` - Language Server Protocol (from Hololand)
  - `@holoscript/std` - Standard library (from Hololand)
  - `@holoscript/fs` - File system utilities (from Hololand)

### Removed

- Platform adapters moved to Hololand repo:
  - `@holoscript/babylon-adapter` → `@hololand/babylon-adapter`
  - `@holoscript/three-adapter` → `@hololand/three-adapter`
  - `@holoscript/playcanvas-adapter` → `@hololand/playcanvas-adapter`
  - `@holoscript/unity-adapter` → `@hololand/unity-adapter`
  - `@holoscript/vrchat-export` → `@hololand/vrchat-export`
  - `@holoscript/creator-tools` → `@hololand/creator-tools`

### Changed

- HoloScript is now the **language repo** (parser, runtime, dev tools)
- Hololand is now the **platform repo** (adapters, Brittney AI, apps)
- Updated LSP dependency from `@hololand/core` to `@holoscript/core`

### Fixed

- Runtime timing.ts TypeScript error with `requestIdleCallback` narrowing

## [2.0.2] - 2026-01-18

### Fixed

- Minor bug fixes and stability improvements following 2.0.0 release

## [2.0.1] - 2026-01-18

### Fixed

- Post-release patch for 2.0.0

## [2.0.0] - 2026-01-17

### Added

- Comprehensive test suite with 108+ tests (VoiceInputTrait, AIDriverTrait, TypeChecker, Runtime)
- VoiceInputTrait with Web Speech API integration, fuzzy matching, and event handling
- AIDriverTrait with behavior trees, GOAP planning, and 4 decision modes (reactive, goal-driven, learning, hybrid)
- Enhanced type inference system with support for all HoloScript types
- Runtime optimization with object pooling and caching
- DeveloperExperience tools with enhanced error formatting and REPL support
- Full CI/CD pipeline with GitHub Actions for automated testing and publishing
- Version management scripts for semantic versioning
- Complete NPM publishing infrastructure

### Changed

- Improved error messaging with source code context
- Enhanced CLI with better formatting and help text
- Optimized parser with better error recovery
- Type system now supports complex inference patterns

### Fixed

- Parser duplicate return statement (line 1067)
- Test suite alignment with actual implementation APIs
- Web Speech API graceful degradation in test environments

### Removed

- Removed aspirational test files that referenced non-existent APIs
- Cleaned up hanging test implementations

## [1.0.0-alpha.2] - 2026-01-16

### Changed

- Improved error messaging and source code context
- Enhanced CLI with better formatting

### Fixed

- Parser error handling and recovery

## [1.0.0-alpha.2] - 2026-01-16

### Added

- AIDriverTrait implementation with behavior trees
- Enhanced type system with inference
- Performance telemetry system
- Commerce system integration

### Fixed

- Test suite alignment with actual APIs
- Parser duplicate return statement

## [1.0.0-alpha.1] - 2026-01-16

### Added

- Initial HoloScript+ release
- VoiceInputTrait with Web Speech API
- Type checker with inference
- REPL and CLI tools
- Runtime execution engine
- Trait system for extensibility
