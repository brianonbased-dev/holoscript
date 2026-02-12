# Changelog

All notable changes to the HoloScript Unity SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-12

### Added
- ✨ Unity 6 support with volumetric rendering integration
- ✨ Unity 2022.3 LTS support
- ✨ Automatic `.hs`, `.hsplus`, `.holo` file import via ScriptedImporter
- ✨ Runtime HoloScript compiler component
- ✨ Full trait system mapping to Unity components
- ✨ XR Interaction Toolkit integration for VR traits
- ✨ Material system with PBR support
- ✨ Assembly definitions to prevent namespace pollution (Pattern G.010.01)
- ✨ Comprehensive unit test suite (Runtime + Editor tests)
- 📚 Complete API documentation

### Changed
- **BREAKING**: Minimum Unity version is now 2022.3 LTS
- **BREAKING**: Replaced legacy XR system with XR Interaction Toolkit 2.3+
- Improved compilation performance with caching
- Updated HoloScriptObject component API

### Deprecated
- Unity 2021 support (use HoloScript SDK 2.5.x for Unity 2021)

### Fixed
- Material property synchronization issues
- Transform hierarchy parenting bugs
- Color parsing for hex values

### Security
- Added input validation for HoloScript source compilation
- Sanitized file path handling in asset importer

## [2.5.10] - 2025-11-15 (Legacy)

### Fixed
- Unity 2021 compatibility issues
- Asset import race conditions

## [2.5.0] - 2025-09-01 (Legacy)

### Added
- Initial Unity 2021 LTS support
- Basic trait system
- Simple asset importer

---

**Migration Guides:**
- [Upgrading from 2.5.x to 3.0.0](https://holoscript.dev/docs/unity/migration-2.5-to-3.0)
- [Unity 2021 to 2022 Migration](https://holoscript.dev/docs/unity/migration-unity-versions)
