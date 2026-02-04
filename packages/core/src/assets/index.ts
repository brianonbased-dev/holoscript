/**
 * @holoscript/core Asset System
 *
 * Comprehensive asset management for HoloScript and Hololand integration.
 */

// Asset Metadata
export {
  AssetMetadata,
  AssetFormat,
  AssetType,
  TextureFormat,
  CompressionFormat,
  LODLevel,
  AssetDependency,
  PlatformCompatibility,
  createAssetMetadata,
  getMimeType,
  inferAssetType,
  estimateMemoryUsage,
} from './AssetMetadata';

// Asset Manifest
export {
  AssetManifest,
  AssetManifestData,
  ManifestConfig,
  ManifestStats,
  AssetGroup,
  createManifest,
  loadManifest,
} from './AssetManifest';

// Asset Registry
export {
  AssetRegistry,
  AssetEventType,
  AssetEvent,
  AssetEventListener,
  CacheEntry,
  RegistryConfig,
  getAssetRegistry,
  registerManifest,
  loadAsset,
  preloadAssets,
} from './AssetRegistry';

// Asset Validator
export {
  AssetValidator,
  ValidationRule,
  ValidationResult,
  ValidationSeverity,
  createAssetValidator,
  validateAsset,
  isAssetValid,
} from './AssetValidator';

// Smart Asset Loader
export {
  SmartAssetLoader,
  LoaderConfig,
  LoadRequest,
  LoadProgress,
  LoadResult,
  Platform,
  Quality,
  LoadPriority,
  getSmartAssetLoader,
  createSmartAssetLoader,
  smartLoad,
} from './SmartAssetLoader';

// Asset Aliases
export {
  DEFAULT_ASSET_ALIASES,
  resolveAssetAlias,
} from './AssetAliases';

// Asset Dependency Graph
export {
  AssetDependencyGraph,
  DependencyNode,
  ResolutionResult,
  createDependencyGraph,
  buildDependencyGraph,
  getOptimalLoadOrder,
} from './AssetDependencyGraph';

// Humanoid Avatar Loader (VRM & Ready Player Me)
export {
  HumanoidLoader,
  HumanoidConfig,
  HumanoidState,
  HumanoidLoadResult,
  HumanoidLoaderEvent,
  HumanoidEventCallback,
  AvatarFormat,
  VRMBoneName,
  VRMExpressionName,
  VRMMetadata,
  RPMMetadata,
  SkeletonPose,
  BoneTransform,
  getHumanoidLoader,
  createHumanoidLoader,
  loadHumanoid,
} from './HumanoidLoader';
