# HoloScript Brittney Fine-Tuning Training Data

This directory contains split training data for fine-tuning Brittney on HoloScript code generation.

## Directory Structure

### Core Training (Original Examples)

| File | Category | Examples | Description |
|------|----------|----------|-------------|
| `01-npcs-characters.jsonl` | NPCs & Characters | 3 | `npc()` with behaviors, triggers, conditions |
| `02-quests.jsonl` | Quests | 3 | `quest()` with objectives, rewards, branches |
| `03-abilities.jsonl` | Abilities | 3 | `ability()` spells, combat, scaling |
| `04-dialogue.jsonl` | Dialogue | 3 | `dialogue()` branching, choices, actions |
| `05-scenes.jsonl` | Scenes | 3 | `scene()` environments, objects, audio |
| `06-state-machines.jsonl` | State Machines | 2 | `stateMachine()` AI behavior, phases |
| `07-sequences.jsonl` | Sequences | 2 | `sequence()` timed events, cinematics |
| `08-achievements.jsonl` | Achievements | 3 | `achievement()` progress, rewards |
| `09-localization.jsonl` | Localization | 3 | `localizedText()` multi-language |
| `10-talent-trees.jsonl` | Talent Trees | 3 | `talentTree()` class progression |

### Assistant Guidance Training (NEW)

| File | Category | Examples | Description |
|------|----------|----------|-------------|
| `11-guidance-basics.jsonl` | Basic Guidance | 12 | "What do I need" + "What's next" for NPCs, quests, abilities, dialogue, scenes, state machines |
| `12-guidance-advanced.jsonl` | Advanced Guidance | 8 | Prerequisites & next steps for complete features, bosses, crafting, multiplayer |
| `13-tutorials-howto.jsonl` | Step-by-Step Tutorials | 8 | Detailed walkthroughs: first NPC, patrol, combat, dialogue, audio, particles, save/load |

### Advanced & Deep-Dive Training (NEW)

| File | Category | Examples | Description |
|------|----------|----------|-------------|
| `14-npcs-advanced.jsonl` | Advanced NPCs | 4 | Complex shopkeepers, companions, bosses, dynamic schedules |
| `15-troubleshooting.jsonl` | Debugging Help | 6 | Common issues: NPC attacks, quest completion, dialogue, abilities, scenes, state machines |
| `16-best-practices.jsonl` | Best Practices | 4 | Performance optimization, project organization, reusable code, anti-patterns |
| `17-complex-systems.jsonl` | Complete Systems | 3 | Quest chains with branching, crafting systems, multiplayer PvP arenas |

### HoloScript+ (.hsplus) Format Training (NEW)

These files use the proper Brittney output format with `<thinking>` sections and ```holoscript code blocks:

| File | Category | Examples | Description |
|------|----------|----------|-------------|
| `18-hsplus-basics.jsonl` | VR Interaction Basics | 6 | Grabbable, pointable, throwable, scalable, hoverable, breakable objects with VR traits |
| `19-hsplus-environments.jsonl` | Environments & Scenes | 4 | Foggy forest, night sky, VR rooms, underwater scenes with lighting and particles |
| `20-hsplus-npcs.jsonl` | NPCs with State Machines | 4 | Patrol creatures, shopkeepers, multi-phase bosses, networked multiplayer objects |
| `21-declarative-mindset.jsonl` | JS→HoloScript Conversion | 7 | Converting imperative JS thinking to declarative HoloScript patterns |
| `22-hsplus-guidance.jsonl` | Guidance & Prerequisites | 5 | "What do I need" / "What's next" for VR development learning paths |
| `23-hsplus-troubleshooting.jsonl` | Debugging .hsplus | 5 | Animation, trigger zones, physics, networking, VR controller issues |
| `24-hsplus-examples.jsonl` | Complete Examples | 5 | VR menu, treasure chest, lever, torch, laser gun with full implementations |

**Total: 109 examples** (28 original + 31 guidance/advanced + 36 hsplus format)

## Training Approaches

### Option 1: Full Combined Training
Use `holoscript-all-combined.jsonl` for training on all categories at once.

```bash
# Combine all files (PowerShell)
Get-Content *.jsonl | Set-Content holoscript-all-combined.jsonl
```

### Option 2: Domain-Specific Fine-Tuning
Train separate LoRA adapters for each category, then merge or switch based on task:

1. **Game Content Creator** - Files 01-05, 14, 17 (NPCs, Quests, Abilities, Dialogue, Scenes, Complex Systems)
2. **Systems & Logic** - Files 06-08 (State Machines, Sequences, Achievements)
3. **Infrastructure** - Files 09-10 (Localization, Talent Trees)
4. **Assistant/Guide** - Files 11-13, 15 (Guidance, Tutorials, Troubleshooting)
5. **Engineering** - Files 15-16 (Troubleshooting, Best Practices)

### Option 3: Progressive Training
Start with foundational categories, then fine-tune on advanced:

1. **Phase 1 (Core)**: `03-abilities.jsonl`, `01-npcs-characters.jsonl`
2. **Phase 2 (Content)**: `02-quests.jsonl`, `04-dialogue.jsonl`, `05-scenes.jsonl`
3. **Phase 3 (Systems)**: `06-state-machines.jsonl`, `07-sequences.jsonl`
4. **Phase 4 (Polish)**: `08-achievements.jsonl`, `09-localization.jsonl`, `10-talent-trees.jsonl`
5. **Phase 5 (Guidance)**: `11-guidance-basics.jsonl`, `12-guidance-advanced.jsonl`, `13-tutorials-howto.jsonl`
6. **Phase 6 (Expert)**: `14-npcs-advanced.jsonl`, `15-troubleshooting.jsonl`, `16-best-practices.jsonl`, `17-complex-systems.jsonl`

### Option 4: Assistant vs Code Generation
Split training by output type:

**Code Generation** (files 01-10, 14, 17):
- Prompt → HoloScript code output
- For building game content

**Assistant Guidance** (files 11-13, 15-16):
- Prompt → Explanatory text + code examples
- For helping users understand what to do and how

### Option 5: Brittney Format (.hsplus) Training
For proper VR development with `<thinking>` + `holoscript` output:

1. **VR Fundamentals** (18-20): Basics, environments, NPCs
2. **Mindset Training** (21): Converting JS thinking to declarative patterns
3. **Guidance & Debug** (22-23): Prerequisites, next steps, troubleshooting
4. **Complete Examples** (24): Full working implementations

This trains Brittney to reason about HoloScript declaratively and output proper .hsplus code.

## Format

All files use JSONL format with prompt-completion pairs:

```json
{"prompt": "Natural language description", "completion": "HoloScript code"}
```

## Recommended Fine-Tuning Parameters

For this dataset (~109 examples), consider:

- **Epochs**: 3-5 (small dataset needs more passes)
- **Learning Rate**: 1e-5 to 5e-5
- **Batch Size**: 2-4
- **LoRA rank**: 8-16 (efficient for domain adaptation)

## Augmentation Suggestions

To expand training data:

1. **Variation Generation** - Create variations of existing examples
2. **Parameter Shuffling** - Change names, values, conditions
3. **Complexity Scaling** - Create simpler and more complex versions
4. **Error Examples** - Include incorrect → correct pairs
5. **Conversational Pairs** - Follow-up questions and refinements

## New Training Categories Explained

### Guidance Files (11-13)
These train Brittney to act as a helpful assistant, not just a code generator:
- **"What do I need"** - Prerequisites, required knowledge, dependencies
- **"What's next"** - Suggested next steps, progressive learning path
- **"How do I"** - Step-by-step tutorials with explanations

### Deep-Dive Files (14-17)
Advanced training for complex scenarios:
- **Advanced NPCs** - Shopkeepers, companions, bosses with phases
- **Troubleshooting** - Common issues and debugging strategies
- **Best Practices** - Code organization, performance, anti-patterns
- **Complex Systems** - Complete implementations (crafting, PvP, quest chains)

### HoloScript+ (.hsplus) Files (18-24)
Training with proper Brittney output format for VR development:

**Output Format:**
```
<thinking>
Reasoning about declarative approach...
Identify JS patterns → Convert to HoloScript constructs
</thinking>

```holoscript
// Actual .hsplus code here
```
```

**Key .hsplus Concepts:**
- **VR Traits:** `@grabbable`, `@pointable`, `@hoverable`, `@throwable`, `@breakable`, `@networked`, `@scalable`
- **Events:** `onPoint`, `onGrab`, `onRelease`, `onHoverEnter`, `onHoverExit`, `onTriggerEnter`, `onSwing`
- **Constructs:** `composition`, `prefab`, `template`, `object`, `state`, `animation`, `trigger_zone`, `states`
- **Declarative Patterns:** Use `every()` not `setInterval`, use `trigger_zone` not distance polling, use `animation` not `requestAnimationFrame`

**Declarative Mindset Training (21):**
Converts imperative JavaScript thinking to declarative HoloScript patterns:
- `setInterval` → `every()`
- `requestAnimationFrame` → `animation` block
- `addEventListener` → `@pointable` + `@on_point`
- Distance polling → `trigger_zone`
- `for` loops → `scatter` / `grid`
- Conditionals → `@visible` bindings

## Usage with Model Lab

```powershell
# Copy to Hololand brittney training folder
Copy-Item *.jsonl "C:\...\Hololand\✱brittney\brittney-holoscript-training-v1.jsonl\"
```
