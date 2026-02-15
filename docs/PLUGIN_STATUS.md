# HoloScript Scientific & Domain Plugin Status

> Production-ready plugins extending HoloScript into drug discovery, protein science, medical imaging, and robotics.

## Overview

Four domain plugins are built and tested, adding specialized traits and code generators to HoloScript. These plugins compile to the same multi-target outputs (Web, VR, AR, Unity) while enabling domain-specific workflows.

```
┌─────────────────────────────────────────────────────────┐
│                    HoloScript Core                       │
│           Parser · Traits · Compiler · MCP              │
└──────────┬───────┬───────────┬──────────┬───────────────┘
           │       │           │          │
   ┌───────▼──┐ ┌──▼─────┐ ┌──▼────┐ ┌───▼──────┐
   │ Narupa   │ │AlphaFold│ │Medical│ │ Robotics │
   │ (Drug)   │ │(Protein)│ │(DICOM)│ │(ROS2/USD)│
   └──────────┘ └────────┘ └───────┘ └──────────┘
```

---

## Plugin Status

| Plugin | Version | npm | Tests | Python | Repository |
|--------|---------|-----|-------|--------|------------|
| @holoscript/narupa-plugin | 1.2.0 | ✅ Published | ✅ 47 | MDAnalysis | [holoscript-scientific-plugin](https://github.com/brianonbased-dev/holoscript-scientific-plugin) |
| @holoscript/alphafold-plugin | 1.0.0 | ✅ Published | ✅ | JAX/AlphaFold | [holoscript-alphafold-plugin](https://github.com/brianonbased-dev/holoscript-alphafold-plugin) |
| @holoscript/medical-plugin | 1.0.0 | 📦 Ready | ✅ 26 | pydicom | [holoscript-medical-plugin](https://github.com/brianonbased-dev/holoscript-medical-plugin) |
| @holoscript/robotics-plugin | 1.0.0 | 📦 Ready | ✅ 34 | roslibpy | [holoscript-robotics-plugin](https://github.com/brianonbased-dev/holoscript-robotics-plugin) |

**Total**: 107+ integration tests across 4 plugins.

---

## 1. @holoscript/narupa-plugin — Drug Discovery

Interactive molecular dynamics simulation for drug discovery in VR/AR. Connect to Narupa molecular dynamics servers for real-time force application on protein-ligand systems.

**Traits**: `@molecule`, `@imd_force`, `@trajectory`, `@selection`

```holo
composition "Drug Docking" {
  object "Protein" @molecule {
    source: "1ubq.pdb"
    representation: "cartoon"
    color_scheme: "secondary_structure"
  }

  object "Ligand" @molecule @grabbable {
    source: "aspirin.sdf"
    representation: "ball_and_stick"
  }

  object "IMDForce" @imd_force {
    target: "Ligand"
    spring_constant: 100.0
  }
}
```

---

## 2. @holoscript/alphafold-plugin — Protein Structure Prediction

AlphaFold2 integration for protein structure prediction with pLDDT confidence visualization and PAE matrices.

**Traits**: `@alphafold_prediction`, `@plddt_visualization`, `@pae_matrix`, `@msa_viewer`

```holo
composition "Protein Analysis" {
  object "Target" @alphafold_prediction {
    sequence: "MKWVTFISLLFLFSSAYS..."
    model_preset: "monomer"
    num_recycles: 3
  }

  object "Confidence" @plddt_visualization {
    target: "Target"
    color_scheme: "plddt_rainbow"
    threshold: 70.0
  }
}
```

---

## 3. @holoscript/medical-plugin — Medical Imaging & Simulation

DICOM visualization (CT/MRI/PET), surgical planning, anatomical education, and medical procedure simulation with haptic feedback.

**Traits**: `@dicom_viewer`, `@surgical_plan`, `@anatomical_model`, `@medical_simulation`

**Config Interfaces**:
- `DICOMViewerConfig` — Slice/3D/MPR/VR modes, window/level, color maps
- `SurgicalPlanConfig` — Craniotomy, arthroplasty, tumor resection workflows
- `AnatomicalModelConfig` — Heart/brain/skeleton with layers and animations
- `MedicalSimulationConfig` — CPR, intubation, suturing with haptics and assessment

```holo
composition "Radiology Workstation" {
  object "CTScan" @dicom_viewer {
    source: "/studies/brain_ct.dcm"
    mode: "3d_volume"
    windowLevel: { center: 40, width: 400 }
    colorMap: "bone"
  }

  object "HeartModel" @anatomical_model {
    anatomy: "heart"
    detail: "high_detail"
    animation: { type: "heartbeat", speed: 1.0 }
    educational: { quiz: true }
  }

  object "CPRTrainer" @medical_simulation {
    type: "cpr"
    haptics: { enabled: true, resistance: 0.6 }
    assessment: { enabled: true, criteria: ["depth", "rate"] }
  }
}
```

---

## 4. @holoscript/robotics-plugin — Robotics & Digital Twins

Compile HoloScript to USD (NVIDIA Isaac Sim), URDF (ROS2/Gazebo), SDF, and MJCF. Full lexer → parser → AST → code generation pipeline.

**Traits**: `@joint_revolute`, `@joint_prismatic`, `@force_sensor`, `@actuator`

**Code generators**: USD (Isaac Sim), URDF (ROS2), SDF (Gazebo), MJCF (MuJoCo)

```holo
composition "TwoLinkArm" {
  object "Base" {
    geometry: "cube"
    dimensions: [0.2, 0.2, 0.1]
    mass: 5.0
  }

  object "Shoulder" @joint_revolute {
    parent: "Base"
    axis: [0, 0, 1]
    lower_limit: -3.14
    upper_limit: 3.14
  }

  object "UpperArm" {
    geometry: "cylinder"
    length: 0.5
    radius: 0.05
    mass: 2.0
    parent: "Shoulder"
  }
}
```

**Generated USD**:
```usda
#usda 1.0
(
  defaultPrim = "TwoLinkArm"
  upAxis = "Z"
  metersPerUnit = 1.0
)

def Xform "TwoLinkArm" (
  prepend apiSchemas = ["PhysicsArticulationRootAPI"]
)
{
  def Xform "Base" { ... }
  def Xform "UpperArm" { ... }
  def PhysicsRevoluteJoint "Shoulder" { ... }
}
```

---

## Plugin Architecture

All plugins follow a common structure:

```
@holoscript/<domain>-plugin/
├── src/index.ts           # TypeScript interfaces & trait configs
├── python/bridge.py       # Python integration (optional)
├── examples/demo.holo     # Example compositions
├── tests/integration.test.ts
├── dist/                  # Compiled JS + declarations
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Python Bridge Pattern

Plugins offload compute-heavy processing (DICOM parsing, molecular dynamics, ROS2 communication) to Python bridges:

```typescript
// TypeScript — contract
export interface MyPythonBridge {
  loadData(path: string): Promise<Metadata>;
  process(config: Config): Promise<Result>;
}
```

```python
# Python — implementation
class MyBridge:
    def load_data(self, path: str) -> dict: ...
    def process(self, config: dict) -> dict: ...
```

---

## Installation

```bash
# Published plugins
npm install @holoscript/narupa-plugin
npm install @holoscript/alphafold-plugin

# Awaiting npm publish (install from git)
npm install github:brianonbased-dev/holoscript-medical-plugin
npm install github:brianonbased-dev/holoscript-robotics-plugin
```

## Creating a New Plugin

1. Create repo `holoscript-<domain>-plugin`
2. Add `src/index.ts` with trait config interfaces (export all types)
3. Add `examples/<demo>.holo` demonstrating trait usage
4. Add `tests/integration.test.ts` (use ts-jest)
5. Set `peerDependencies: { "holoscript": "^3.1.0" }`
6. Add Python bridge in `python/` if needed
7. Update this document with the new plugin entry
