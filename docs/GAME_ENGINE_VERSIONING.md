# Game Engine SDK Versioning Matrix

**Research Topic**: Multi-Version Unity/Unreal/Godot Support Strategy
**Date**: 2026-02-12
**Status**: Implementation Guide

---

## Executive Summary

HoloScript compiles to **15+ game engine targets**, each with multiple LTS versions. This guide provides the **canonical versioning strategy** to maintain compatibility across Unity 2021/2022/6, Unreal 4/5, and Godot 3/4 without codebase fragmentation.

**Key Decision**: **Single codebase + conditional compilation + Unity Package Manager version constraints**

---

## Support Matrix (Feb 2026)

| Engine              | Versions Supported | HoloScript SDK Version | Support Until                  | Priority  |
| ------------------- | ------------------ | ---------------------- | ------------------------------ | --------- |
| **Unity 6**         | 6.0 LTS, 6.3 LTS   | 3.0.0+                 | Oct 2026 (6.0), Dec 2027 (6.3) | 🔥 High   |
| **Unity 2022 LTS**  | 2022.3             | 3.0.0+                 | Mid-2024 (fixes)               | ⚠️ Medium |
| **Unity 2021 LTS**  | 2021.3             | 2.5.x (legacy)         | 2026 Extended                  | ⏳ Legacy |
| **Unreal Engine 5** | 5.3+, 5.4          | 3.0.0+                 | Ongoing                        | 🔥 High   |
| **Unreal Engine 4** | 4.27               | 2.8.x (legacy)         | 2025                           | ⏳ Legacy |
| **Godot 4**         | 4.0+, 4.2          | 3.0.0+                 | Ongoing                        | 🔥 High   |
| **Godot 3**         | 3.5                | 2.7.x (legacy)         | 2025                           | ⏳ Legacy |

---

## Unity Package Versioning Strategy

### Package Manifest Configuration

Unity uses `unity` and `unityRelease` fields in `package.json` to enforce compatibility:

```json
// packages/unity-sdk/package.json
{
  "name": "com.holoscript.core",
  "version": "3.0.0",
  "displayName": "HoloScript for Unity",

  // CRITICAL: Minimum Unity version
  "unity": "2022.3",
  "unityRelease": "0f1",

  // Optional: Explicit version requirements
  "dependencies": {
    "com.unity.xr.interaction.toolkit": "2.3.0"
  }
}
```

**Key Rule**: Changing `unity` or `unityRelease` requires **MINOR or MAJOR version bump** (never PATCH).

---

### Multi-Version Support: Three Strategies

#### **Strategy 1: Single Package with Conditional Compilation** ✅ RECOMMENDED

**Use For**: Minor API differences (Unity 2022 → 6)

```csharp
// Runtime/HoloScriptObject.cs
using UnityEngine;

#if UNITY_6_0_OR_NEWER
    using Unity.XR.CoreUtils;
#elif UNITY_2022_3_OR_NEWER
    using UnityEngine.XR;
#endif

namespace HoloScript.Runtime
{
    public class HoloScriptObject : MonoBehaviour
    {
        public void ApplyGrabbableTrait()
        {
#if UNITY_6_0_OR_NEWER
            // Unity 6: New XR Interaction system
            var interactable = gameObject.AddComponent<XRGrabInteractable>();
            interactable.movementType = XRBaseInteractable.MovementType.Instantaneous;
#elif UNITY_2022_3_OR_NEWER
            // Unity 2022: Legacy XR system
            var interactable = gameObject.AddComponent<XRGrabInteractable>();
            interactable.trackPosition = true;
#else
            Debug.LogWarning("XR Interaction Toolkit not available in Unity 2021");
#endif
        }
    }
}
```

**Benefits**:

- ✅ Single codebase
- ✅ Easy to maintain
- ✅ Automatic version detection

**Limitations**:

- ⚠️ Package manifest locked to minimum version (`unity: "2022.3"`)
- ⚠️ Can't optimize for older versions

---

#### **Strategy 2: Separate Packages Per Version** 🎯 FOR BREAKING CHANGES

**Use For**: Major API incompatibilities (Unity 2021 vs 6)

```
packages/
├── unity-sdk/              # Unity 6 + 2022 (com.holoscript.core@3.0.0)
│   └── package.json        # "unity": "2022.3"
│
└── unity-sdk-legacy/       # Unity 2021 (com.holoscript.core@2.5.x)
    └── package.json        # "unity": "2021.3"
```

**package.json (Modern)**:

```json
{
  "name": "com.holoscript.core",
  "version": "3.0.0",
  "unity": "2022.3"
}
```

**package.json (Legacy)**:

```json
{
  "name": "com.holoscript.core",
  "version": "2.5.10",
  "unity": "2021.3"
}
```

**Unity Package Manager Resolution**:

- Unity 6 → Downloads `3.0.0` (compatible)
- Unity 2022 → Downloads `3.0.0` (compatible)
- Unity 2021 → Downloads `2.5.10` (only compatible version)

**Benefits**:

- ✅ Full API compatibility per version
- ✅ Can deprecate old versions cleanly
- ✅ Unity auto-selects correct package

**Limitations**:

- ⚠️ Code duplication
- ⚠️ Must backport critical fixes to legacy

---

#### **Strategy 3: Feature Detection at Runtime** ⚡ ADVANCED

**Use For**: Optional features (Unity 6 volumetric rendering)

```csharp
// Runtime/Features/VolumetricRenderer.cs
using UnityEngine;
using System.Reflection;

namespace HoloScript.Runtime.Features
{
    public static class VolumetricSupport
    {
        private static bool? _isSupported;

        public static bool IsSupported
        {
            get
            {
                if (_isSupported.HasValue)
                    return _isSupported.Value;

                // Runtime detection of Unity 6 volumetric API
                var assembly = Assembly.Load("UnityEngine.VolumetricModule");
                _isSupported = assembly != null;

                return _isSupported.Value;
            }
        }

        public static void EnableVolumetric(GameObject obj)
        {
            if (!IsSupported)
            {
                Debug.LogWarning("Volumetric rendering requires Unity 6+");
                return;
            }

            // Use reflection to avoid compile-time dependency
            var type = Type.GetType("UnityEngine.VolumetricRenderer, UnityEngine.VolumetricModule");
            var component = obj.AddComponent(type);

            // Set properties via reflection
            var densityProp = type.GetProperty("density");
            densityProp.SetValue(component, 0.5f);
        }
    }
}
```

**Benefits**:

- ✅ Graceful degradation
- ✅ Works across all Unity versions
- ✅ No compile errors on older versions

**Limitations**:

- ⚠️ Runtime overhead (reflection)
- ⚠️ No compile-time type safety

---

## HoloScript Recommended Approach

**Hybrid Strategy**: Strategy 1 + Strategy 2

### Current Version Support

```
HoloScript 3.x (com.holoscript.core@3.0.0)
├── Unity 6 (full support)
├── Unity 2022 LTS (full support, minor conditional compilation)
└── Unity 2021 LTS → NOT SUPPORTED (use HoloScript 2.5.x)

HoloScript 2.5.x (com.holoscript.core@2.5.x) - LEGACY
└── Unity 2021 LTS only
```

### Migration Path

**Unity 2021 users upgrading to Unity 6**:

1. Upgrade Unity 2021 → 2022 LTS (or directly to 6)
2. Update HoloScript 2.5.x → 3.0.0 via Package Manager
3. Fix breaking changes (compiler API changes documented in CHANGELOG)

---

## Unreal Engine Versioning

### Unreal Plugin Manifest

```json
// Source/HoloScript/HoloScript.uplugin
{
  "FileVersion": 3,
  "Version": 1,
  "VersionName": "3.0.0",
  "EngineVersion": "5.3.0",
  "MinEngineVersion": "5.3.0", // Enforced minimum
  "Modules": [
    {
      "Name": "HoloScript",
      "Type": "Runtime",
      "LoadingPhase": "Default",
      "WhitelistPlatforms": ["Win64", "Mac", "Linux"]
    }
  ]
}
```

### Conditional Compilation

```cpp
// Source/HoloScript/Private/HoloScriptActor.cpp
#include "HoloScriptActor.h"

#if ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 3
    #include "EnhancedInputComponent.h"
    #include "EnhancedInputSubsystems.h"
#elif ENGINE_MAJOR_VERSION == 4
    #include "InputCoreTypes.h"
#endif

void AHoloScriptActor::SetupInput()
{
#if ENGINE_MAJOR_VERSION == 5
    // Unreal 5: Enhanced Input System
    if (UEnhancedInputComponent* EnhancedInput = Cast<UEnhancedInputComponent>(InputComponent))
    {
        EnhancedInput->BindAction(GrabAction, ETriggerEvent::Started, this, &AHoloScriptActor::OnGrab);
    }
#else
    // Unreal 4: Legacy Input
    InputComponent->BindAction("Grab", IE_Pressed, this, &AHoloScriptActor::OnGrab);
#endif
}
```

---

## Godot Versioning

### Plugin Configuration

```ini
; addons/holoscript/plugin.cfg
[plugin]
name="HoloScript"
description="HoloScript compiler and runtime for Godot"
author="HoloScript Team"
version="3.0.0"
script="plugin.gd"

; Godot 4 only (breaking changes from Godot 3)
```

### GDScript Version Detection

```gdscript
# addons/holoscript/holoscript_compiler.gd
extends EditorPlugin

const GODOT_4_0 = 0x040000 # 4.0.0
const GODOT_4_2 = 0x040200 # 4.2.0

func _ready():
    var version_int = Engine.get_version_info().hex

    if version_int >= GODOT_4_2:
        print("HoloScript: Godot 4.2+ detected, enabling volumetric features")
        enable_volumetric_support()
    elif version_int >= GODOT_4_0:
        print("HoloScript: Godot 4.0+ detected, using standard features")
    else:
        push_error("HoloScript 3.x requires Godot 4.0+. Use HoloScript 2.7.x for Godot 3.5")
```

---

## Testing Matrix

### GitHub Actions Multi-Version Testing

```yaml
# .github/workflows/test-unity.yml
name: Test Unity SDK

on: [push, pull_request]

jobs:
  test-unity:
    strategy:
      matrix:
        unity-version:
          - 2022.3.50f1
          - 6.0.30f1
          - 6.3.0f1 # Latest LTS

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Unity ${{ matrix.unity-version }}
        uses: game-ci/unity-builder@v4
        with:
          unityVersion: ${{ matrix.unity-version }}

      - name: Run Unity Tests
        run: |
          unity-editor -runTests -testPlatform playmode \
            -testResults results-${{ matrix.unity-version }}.xml

      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: unity-test-results-${{ matrix.unity-version }}
          path: results-${{ matrix.unity-version }}.xml
```

---

## Deprecation Timeline

### Unity 2021 LTS End-of-Life

**Announcement**: 2026-03-01
**Support End**: 2026-09-01 (6 months notice)
**Migration Guide**: https://holoscript.dev/docs/unity/migration-2021-to-2022

**Steps**:

1. **T-6 months**: Announce deprecation in CHANGELOG, website, Discord
2. **T-3 months**: Add deprecation warning to Unity 2021 builds
3. **T-0**: Stop publishing HoloScript 2.5.x updates
4. **T+6 months**: Archive legacy Unity SDK repository

---

## Version Bump Decision Tree

```
Is the change Unity 6 specific?
├─ Yes → Use #if UNITY_6_0_OR_NEWER
│         PATCH version bump (3.0.0 → 3.0.1)
│
└─ No → Does it break Unity 2022 compatibility?
        ├─ Yes → MAJOR version bump (3.0.0 → 4.0.0)
        │         Update package.json "unity": "6.0"
        │
        └─ No → MINOR version bump (3.0.0 → 3.1.0)
```

---

## Changelog Format

```markdown
# HoloScript Unity SDK Changelog

## [3.0.0] - 2026-02-12

### Added

- Unity 6 support (volumetric rendering, enhanced XR)
- Unity 2022.3 LTS support

### Changed

- **BREAKING**: Minimum Unity version is now 2022.3
- **BREAKING**: Replaced legacy XR with XR Interaction Toolkit 2.3+

### Deprecated

- Unity 2021 support (use HoloScript 2.5.x for Unity 2021)

### Compatibility

- Unity 6.0+ ✅
- Unity 2022.3+ ✅
- Unity 2021 ❌ (EOL)
```

---

## References

- [Unity Package Versioning](https://docs.unity3d.com/Manual/upm-semver.html)
- [Unity Package Manifest](https://docs.unity3d.com/Manual/upm-manifestPkg.html)
- [Unity 6 Support Timeline](https://unity.com/releases/unity-6/support)
- [Unreal Engine Versioning](https://dev.epicgames.com/documentation/en-us/unreal-engine/versioning-of-binaries)

---

**Last Updated**: 2026-02-12
**Status**: ✅ Implementation Ready
**Next Review**: 2026-09-01 (Unity 2021 EOL)
