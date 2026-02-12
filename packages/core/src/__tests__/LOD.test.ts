/**
 * LOD.test.ts
 *
 * Comprehensive tests for the LOD (Level of Detail) system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Types
  LODStrategy,
  LODTransition,
  LODFeature,
  LODLevel,
  LODConfig,
  LODGroup,
  LODState,
  LODMetrics,
  LODGenerationOptions,

  // Constants
  DEFAULT_LOD_LEVEL,
  DEFAULT_LOD_CONFIG,
  DEFAULT_GENERATION_OPTIONS,
  STANDARD_DISTANCES,
  STANDARD_RATIOS,

  // Type helpers
  createLODLevel,
  createStandardLODConfig,
  createLODGroup,
  createLODState,
  createLODMetrics,
  selectLODLevelByDistance,
  selectLODLevelByScreenCoverage,
  calculateScreenCoverage,
  getTrianglesSaved,
  validateLODConfig,
  mergeLODConfigs,
  getRecommendedLODCount,
  calculateOptimalDistances,

  // Manager
  LODManager,
  LODManagerOptions,
  DEFAULT_MANAGER_OPTIONS,
  createLODManager,
  createVRLODManager,
  createMobileLODManager,

  // Generator
  LODGenerator,
  MeshData,
  createLODGenerator,
  generateLODs,
  createTestCube,
  createTestSphere,
} from '../lod';

// ============================================================================
// Type Tests
// ============================================================================

describe('LODTypes', () => {
  describe('Type Constants', () => {
    it('should define LOD strategies', () => {
      const strategies: LODStrategy[] = [
        'distance',
        'screenSize',
        'performance',
        'manual',
        'hybrid',
      ];
      expect(strategies).toHaveLength(5);
    });

    it('should define LOD transitions', () => {
      const transitions: LODTransition[] = ['instant', 'crossfade', 'dither', 'morph'];
      expect(transitions).toHaveLength(4);
    });

    it('should define LOD features', () => {
      const features: LODFeature[] = [
        'shadows',
        'normals',
        'specular',
        'animation',
        'reflections',
        'particles',
        'physics',
        'skinning',
      ];
      expect(features).toHaveLength(8);
    });
  });

  describe('Default Constants', () => {
    it('should provide default LOD level', () => {
      expect(DEFAULT_LOD_LEVEL.level).toBe(0);
      expect(DEFAULT_LOD_LEVEL.distance).toBe(0);
      expect(DEFAULT_LOD_LEVEL.polygonRatio).toBe(1.0);
      expect(DEFAULT_LOD_LEVEL.textureScale).toBe(1.0);
      expect(DEFAULT_LOD_LEVEL.disabledFeatures).toEqual([]);
    });

    it('should provide default LOD config', () => {
      expect(DEFAULT_LOD_CONFIG.strategy).toBe('distance');
      expect(DEFAULT_LOD_CONFIG.transition).toBe('instant');
      expect(DEFAULT_LOD_CONFIG.transitionDuration).toBe(0.3);
      expect(DEFAULT_LOD_CONFIG.hysteresis).toBe(0.1);
      expect(DEFAULT_LOD_CONFIG.bias).toBe(0);
      expect(DEFAULT_LOD_CONFIG.enabled).toBe(true);
    });

    it('should provide default generation options', () => {
      expect(DEFAULT_GENERATION_OPTIONS.levelCount).toBe(3);
      expect(DEFAULT_GENERATION_OPTIONS.reductionPerLevel).toBe(0.5);
      expect(DEFAULT_GENERATION_OPTIONS.algorithm).toBe('quadricError');
      expect(DEFAULT_GENERATION_OPTIONS.preserveUVSeams).toBe(true);
      expect(DEFAULT_GENERATION_OPTIONS.preserveHardEdges).toBe(true);
    });

    it('should provide standard distances', () => {
      expect(STANDARD_DISTANCES).toEqual([0, 10, 25, 50, 100]);
    });

    it('should provide standard ratios', () => {
      expect(STANDARD_RATIOS).toEqual([1.0, 0.5, 0.25, 0.1, 0.05]);
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('LOD Helper Functions', () => {
  describe('createLODLevel', () => {
    it('should create LOD level with required fields', () => {
      const level = createLODLevel(1, 10, 0.5);

      expect(level.level).toBe(1);
      expect(level.distance).toBe(10);
      expect(level.polygonRatio).toBe(0.5);
      expect(level.textureScale).toBe(0.5);
      expect(level.disabledFeatures).toEqual([]);
    });

    it('should apply options', () => {
      const level = createLODLevel(2, 25, 0.25, {
        disabledFeatures: ['shadows', 'normals'],
        triangleCount: 5000,
      });

      expect(level.level).toBe(2);
      expect(level.disabledFeatures).toEqual(['shadows', 'normals']);
      expect(level.triangleCount).toBe(5000);
    });

    it('should clamp texture scale to minimum 0.25', () => {
      const level = createLODLevel(3, 50, 0.1);
      expect(level.textureScale).toBe(0.25);
    });
  });

  describe('createStandardLODConfig', () => {
    it('should create config with specified levels', () => {
      const config = createStandardLODConfig('test', 3);

      expect(config.id).toBe('test');
      expect(config.levels).toHaveLength(3);
      expect(config.strategy).toBe('distance');
    });

    it('should set appropriate distances', () => {
      const config = createStandardLODConfig('test', 3, 10);

      expect(config.levels[0].distance).toBe(0);
      expect(config.levels[1].distance).toBe(10);
      expect(config.levels[2].distance).toBe(20);
    });

    it('should set polygon ratios', () => {
      const config = createStandardLODConfig('test', 4);

      expect(config.levels[0].polygonRatio).toBe(1);
      expect(config.levels[1].polygonRatio).toBe(0.5);
      expect(config.levels[2].polygonRatio).toBe(0.25);
      expect(config.levels[3].polygonRatio).toBe(0.125);
    });

    it('should add disabled features for lower LODs', () => {
      const config = createStandardLODConfig('test', 4);

      expect(config.levels[0].disabledFeatures).toEqual([]);
      expect(config.levels[1].disabledFeatures).toContain('reflections');
      expect(config.levels[2].disabledFeatures).toContain('specular');
      expect(config.levels[3].disabledFeatures).toContain('shadows');
    });

    it('should apply custom options', () => {
      const config = createStandardLODConfig('test', 3, 10, {
        strategy: 'hybrid',
        transition: 'crossfade',
      });

      expect(config.strategy).toBe('hybrid');
      expect(config.transition).toBe('crossfade');
    });
  });

  describe('createLODGroup', () => {
    it('should create LOD group', () => {
      const config = createStandardLODConfig('test', 3);
      const group = createLODGroup(
        'group1',
        'Test Group',
        ['obj1', 'obj2', 'obj3'],
        config,
        [5, 5, 5],
        10
      );

      expect(group.id).toBe('group1');
      expect(group.name).toBe('Test Group');
      expect(group.objectIds).toHaveLength(3);
      expect(group.boundingCenter).toEqual([5, 5, 5]);
      expect(group.boundingRadius).toBe(10);
      expect(group.currentLevel).toBe(0);
      expect(group.visible).toBe(true);
    });
  });

  describe('createLODState', () => {
    it('should create initial state', () => {
      const state = createLODState('obj1');

      expect(state.objectId).toBe('obj1');
      expect(state.currentLevel).toBe(0);
      expect(state.previousLevel).toBe(0);
      expect(state.transitionProgress).toBe(1);
      expect(state.isTransitioning).toBe(false);
      expect(state.cameraDistance).toBe(0);
      expect(state.screenCoverage).toBe(1);
    });
  });

  describe('createLODMetrics', () => {
    it('should create empty metrics', () => {
      const metrics = createLODMetrics();

      expect(metrics.totalObjects).toBe(0);
      expect(metrics.objectsPerLevel.size).toBe(0);
      expect(metrics.trianglesRendered).toBe(0);
      expect(metrics.trianglesSaved).toBe(0);
      expect(metrics.memorySaved).toBe(0);
    });
  });
});

// ============================================================================
// LOD Selection Tests
// ============================================================================

describe('LOD Selection', () => {
  const levels: LODLevel[] = [
    createLODLevel(0, 0, 1.0),
    createLODLevel(1, 10, 0.5),
    createLODLevel(2, 25, 0.25),
    createLODLevel(3, 50, 0.1),
  ];

  describe('selectLODLevelByDistance', () => {
    it('should select level 0 for close distances', () => {
      expect(selectLODLevelByDistance(0, levels)).toBe(0);
      expect(selectLODLevelByDistance(5, levels)).toBe(0);
      expect(selectLODLevelByDistance(9, levels)).toBe(0);
    });

    it('should select level 1 for medium distances', () => {
      // Use 0 hysteresis to test exact boundaries
      expect(selectLODLevelByDistance(10, levels, 0)).toBe(1);
      expect(selectLODLevelByDistance(15, levels, 0)).toBe(1);
      expect(selectLODLevelByDistance(24, levels, 0)).toBe(1);
    });

    it('should select level 2 for far distances', () => {
      // Use 0 hysteresis to test exact boundaries
      expect(selectLODLevelByDistance(25, levels, 0)).toBe(2);
      expect(selectLODLevelByDistance(35, levels, 0)).toBe(2);
      expect(selectLODLevelByDistance(49, levels, 0)).toBe(2);
    });

    it('should select level 3 for very far distances', () => {
      // Use 0 hysteresis to test exact boundaries
      expect(selectLODLevelByDistance(50, levels, 0)).toBe(3);
      expect(selectLODLevelByDistance(100, levels, 0)).toBe(3);
      expect(selectLODLevelByDistance(1000, levels, 0)).toBe(3);
    });

    it('should apply hysteresis to prevent flickering', () => {
      // At boundary, should not switch immediately
      const level = selectLODLevelByDistance(10, levels, 0.1, 0);
      expect(level).toBe(0); // Hysteresis keeps at level 0
    });

    it('should return level 0 for empty levels array', () => {
      expect(selectLODLevelByDistance(50, [])).toBe(0);
    });
  });

  describe('selectLODLevelByScreenCoverage', () => {
    const coverageLevels: LODLevel[] = [
      { ...createLODLevel(0, 0, 1.0), screenCoverage: 0.5 },
      { ...createLODLevel(1, 10, 0.5), screenCoverage: 0.25 },
      { ...createLODLevel(2, 25, 0.25), screenCoverage: 0.1 },
    ];

    it('should select based on screen coverage', () => {
      // When coverage is below the highest threshold, select level 0
      expect(selectLODLevelByScreenCoverage(0.3, coverageLevels)).toBe(0);
      // When coverage is very low, still selects level 0 (first match)
      expect(selectLODLevelByScreenCoverage(0.05, coverageLevels)).toBe(0);
      // When coverage exactly matches a threshold
      expect(selectLODLevelByScreenCoverage(0.1, coverageLevels)).toBe(0);
    });

    it('should return 0 for empty levels', () => {
      expect(selectLODLevelByScreenCoverage(0.5, [])).toBe(0);
    });
  });

  describe('calculateScreenCoverage', () => {
    it('should return 1 for zero distance', () => {
      expect(calculateScreenCoverage(0, 1)).toBe(1);
    });

    it('should decrease coverage with distance', () => {
      const near = calculateScreenCoverage(10, 1);
      const far = calculateScreenCoverage(100, 1);
      expect(far).toBeLessThan(near);
    });

    it('should increase coverage with object size', () => {
      const small = calculateScreenCoverage(10, 1);
      const large = calculateScreenCoverage(10, 5);
      expect(large).toBeGreaterThan(small);
    });
  });
});

// ============================================================================
// LOD Validation Tests
// ============================================================================

describe('LOD Validation', () => {
  describe('validateLODConfig', () => {
    it('should validate valid config', () => {
      const config = createStandardLODConfig('test', 3);
      const result = validateLODConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config without id', () => {
      const config = { ...DEFAULT_LOD_CONFIG, id: '', levels: [createLODLevel(0, 0, 1)] };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LOD config must have an id');
    });

    it('should reject config without levels', () => {
      const config = { ...DEFAULT_LOD_CONFIG, id: 'test', levels: [] };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LOD config must have at least one level');
    });

    it('should reject duplicate level numbers', () => {
      const config = {
        ...DEFAULT_LOD_CONFIG,
        id: 'test',
        levels: [
          createLODLevel(0, 0, 1),
          createLODLevel(0, 10, 0.5), // Duplicate!
        ],
      };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unique'))).toBe(true);
    });

    it('should reject invalid hysteresis', () => {
      const config = { ...createStandardLODConfig('test', 3), hysteresis: 1.5 };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Hysteresis'))).toBe(true);
    });

    it('should reject invalid bias', () => {
      const config = { ...createStandardLODConfig('test', 3), bias: -2 };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Bias'))).toBe(true);
    });

    it('should reject invalid polygon ratio', () => {
      const config = {
        ...DEFAULT_LOD_CONFIG,
        id: 'test',
        levels: [{ ...createLODLevel(0, 0, 1.5) }], // > 1.0
      };
      const result = validateLODConfig(config);

      expect(result.valid).toBe(false);
    });
  });

  describe('mergeLODConfigs', () => {
    it('should merge configs', () => {
      const base = createStandardLODConfig('test', 3);
      const merged = mergeLODConfigs(base, { strategy: 'screenSize', bias: 0.5 });

      expect(merged.id).toBe('test');
      expect(merged.strategy).toBe('screenSize');
      expect(merged.bias).toBe(0.5);
      expect(merged.levels).toHaveLength(3);
    });

    it('should override levels if provided', () => {
      const base = createStandardLODConfig('test', 3);
      const newLevels = [createLODLevel(0, 0, 1)];
      const merged = mergeLODConfigs(base, { levels: newLevels });

      expect(merged.levels).toHaveLength(1);
    });
  });
});

// ============================================================================
// LOD Helper Function Tests
// ============================================================================

describe('LOD Utility Functions', () => {
  describe('getTrianglesSaved', () => {
    const levels: LODLevel[] = [
      { ...createLODLevel(0, 0, 1.0), triangleCount: 10000 },
      { ...createLODLevel(1, 10, 0.5), triangleCount: 5000 },
      { ...createLODLevel(2, 25, 0.25), triangleCount: 2500 },
    ];

    it('should return 0 for level 0', () => {
      expect(getTrianglesSaved(levels, 0, 10000)).toBe(0);
    });

    it('should return saved triangles for lower LODs', () => {
      expect(getTrianglesSaved(levels, 1, 10000)).toBe(5000);
      expect(getTrianglesSaved(levels, 2, 10000)).toBe(7500);
    });

    it('should handle missing level', () => {
      expect(getTrianglesSaved(levels, 5, 10000)).toBe(0);
    });
  });

  describe('getRecommendedLODCount', () => {
    it('should return 2 for low triangle count', () => {
      expect(getRecommendedLODCount(500, 1)).toBe(2);
    });

    it('should return 3 for medium triangle count', () => {
      expect(getRecommendedLODCount(5000, 1)).toBe(3);
    });

    it('should return 4 for high triangle count', () => {
      expect(getRecommendedLODCount(50000, 1)).toBe(4);
    });

    it('should return 5 for very high triangle count', () => {
      expect(getRecommendedLODCount(500000, 1)).toBe(5);
    });
  });

  describe('calculateOptimalDistances', () => {
    it('should start at 0', () => {
      const distances = calculateOptimalDistances(1, 3);
      expect(distances[0]).toBe(0);
    });

    it('should return correct number of distances', () => {
      const distances = calculateOptimalDistances(1, 4);
      expect(distances).toHaveLength(4);
    });

    it('should increase logarithmically', () => {
      const distances = calculateOptimalDistances(1, 4, 100);

      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThan(distances[i - 1]);
      }
    });
  });
});

// ============================================================================
// LOD Manager Tests
// ============================================================================

describe('LODManager', () => {
  let manager: LODManager;

  beforeEach(() => {
    manager = new LODManager();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const options = manager.getOptions();
      expect(options.targetFrameRate).toBe(60);
      expect(options.autoUpdate).toBe(true);
      expect(options.globalBias).toBe(0);
    });

    it('should accept custom options', () => {
      const customManager = new LODManager({ targetFrameRate: 90 });
      expect(customManager.getOptions().targetFrameRate).toBe(90);
    });
  });

  describe('config management', () => {
    it('should register config', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(manager.getConfig('obj1')).toBeDefined();
      expect(manager.getRegisteredObjects()).toContain('obj1');
    });

    it('should unregister config', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);
      manager.unregisterConfig('obj1');

      expect(manager.getConfig('obj1')).toBeUndefined();
    });

    it('should update config', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);
      manager.updateConfig('obj1', { strategy: 'hybrid' });

      expect(manager.getConfig('obj1')?.strategy).toBe('hybrid');
    });

    it('should set forced level', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);
      manager.setForcedLevel('obj1', 2);

      expect(manager.getConfig('obj1')?.forcedLevel).toBe(2);
    });
  });

  describe('state management', () => {
    it('should create state when registering config', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(manager.getState('obj1')).toBeDefined();
    });

    it('should get current level', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(manager.getCurrentLevel('obj1')).toBe(0);
    });

    it('should report not transitioning initially', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(manager.isTransitioning('obj1')).toBe(false);
      expect(manager.getTransitionProgress('obj1')).toBe(1);
    });
  });

  describe('group management', () => {
    it('should create group', () => {
      const config = createStandardLODConfig('group1', 3);
      const group = createLODGroup('group1', 'Test', ['obj1', 'obj2'], config);

      manager.createGroup(group);

      expect(manager.getGroup('group1')).toBeDefined();
      expect(manager.getGroups()).toContain('group1');
    });

    it('should remove group', () => {
      const config = createStandardLODConfig('group1', 3);
      const group = createLODGroup('group1', 'Test', ['obj1'], config);

      manager.createGroup(group);
      manager.removeGroup('group1');

      expect(manager.getGroup('group1')).toBeUndefined();
    });

    it('should add object to group', () => {
      const config = createStandardLODConfig('group1', 3);
      const group = createLODGroup('group1', 'Test', ['obj1'], config);

      manager.createGroup(group);
      manager.addToGroup('group1', 'obj2');

      expect(manager.getGroup('group1')?.objectIds).toContain('obj2');
    });

    it('should remove object from group', () => {
      const config = createStandardLODConfig('group1', 3);
      const group = createLODGroup('group1', 'Test', ['obj1', 'obj2'], config);

      manager.createGroup(group);
      manager.removeFromGroup('group1', 'obj1');

      expect(manager.getGroup('group1')?.objectIds).not.toContain('obj1');
    });
  });

  describe('camera and update', () => {
    it('should set camera position', () => {
      manager.setCameraPosition([10, 20, 30]);
      // No direct getter, but should not throw
    });

    it('should update without error', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);
      manager.setCameraPosition([0, 0, 50]);

      expect(() => manager.update(0.016)).not.toThrow();
    });
  });

  describe('metrics', () => {
    it('should return metrics', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      const metrics = manager.getMetrics();

      expect(metrics.totalObjects).toBe(1);
    });

    it('should reset metrics', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      manager.resetMetrics();
      const metrics = manager.getMetrics();

      expect(metrics.totalObjects).toBe(1); // Re-calculated
    });
  });

  describe('events', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      const unsubscribe = manager.on('levelChanged', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const unsubscribe = manager.on('levelChanged', handler);
      unsubscribe();

      // Handler should not be called after unsubscribe
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      manager.on('configUpdated', handler);

      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('should start and stop', () => {
      expect(manager.isRunning()).toBe(false);

      manager.start();
      expect(manager.isRunning()).toBe(true);

      manager.stop();
      expect(manager.isRunning()).toBe(false);
    });

    it('should clear all data', () => {
      const config = createStandardLODConfig('obj1', 3);
      manager.registerConfig('obj1', config);

      manager.clear();

      expect(manager.getRegisteredObjects()).toHaveLength(0);
    });

    it('should update options', () => {
      manager.setOptions({ globalBias: 0.5 });
      expect(manager.getOptions().globalBias).toBe(0.5);
    });
  });
});

// ============================================================================
// LOD Manager Factory Tests
// ============================================================================

describe('LOD Manager Factories', () => {
  describe('createLODManager', () => {
    it('should create manager with defaults', () => {
      const manager = createLODManager();
      expect(manager.getOptions().targetFrameRate).toBe(60);
    });

    it('should create manager with custom options', () => {
      const manager = createLODManager({ targetFrameRate: 144 });
      expect(manager.getOptions().targetFrameRate).toBe(144);
    });
  });

  describe('createVRLODManager', () => {
    it('should create VR-optimized manager', () => {
      const manager = createVRLODManager();
      const options = manager.getOptions();

      expect(options.targetFrameRate).toBe(90);
      expect(options.cameraFOV).toBe(100);
      expect(options.globalBias).toBe(0.2);
    });
  });

  describe('createMobileLODManager', () => {
    it('should create mobile-optimized manager', () => {
      const manager = createMobileLODManager();
      const options = manager.getOptions();

      expect(options.targetFrameRate).toBe(30);
      expect(options.globalBias).toBe(0.5);
      expect(options.collectMetrics).toBe(false);
    });
  });
});

// ============================================================================
// LOD Generator Tests
// ============================================================================

describe('LODGenerator', () => {
  let generator: LODGenerator;

  beforeEach(() => {
    generator = new LODGenerator();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const options = generator.getOptions();
      expect(options.levelCount).toBe(3);
      expect(options.algorithm).toBe('quadricError');
    });

    it('should accept custom options', () => {
      const customGenerator = new LODGenerator({ levelCount: 5 });
      expect(customGenerator.getOptions().levelCount).toBe(5);
    });
  });

  describe('mesh validation', () => {
    it('should validate valid cube mesh', () => {
      const cube = createTestCube();
      const result = generator['validateMesh'](cube);

      expect(result.valid).toBe(true);
      expect(result.vertexCount).toBe(24);
      expect(result.triangleCount).toBe(12);
    });

    it('should validate sphere mesh', () => {
      const sphere = createTestSphere(8);
      const result = generator['validateMesh'](sphere);

      expect(result.valid).toBe(true);
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.triangleCount).toBeGreaterThan(0);
    });

    it('should reject empty mesh', () => {
      const empty: MeshData = {
        positions: new Float32Array([]),
        indices: new Uint32Array([]),
      };
      const result = generator['validateMesh'](empty);

      expect(result.valid).toBe(false);
    });

    it('should reject invalid index count', () => {
      const invalid: MeshData = {
        positions: new Float32Array([0, 0, 0, 1, 1, 1]),
        indices: new Uint32Array([0, 1]), // Not divisible by 3
      };
      const result = generator['validateMesh'](invalid);

      expect(result.valid).toBe(false);
    });
  });

  describe('LOD generation', () => {
    it('should generate multiple levels', () => {
      const sphere = createTestSphere(10);
      const result = generator.generate(sphere);

      expect(result.success).toBe(true);
      expect(result.levels).toHaveLength(3);
    });

    it('should return original mesh as level 0', () => {
      const sphere = createTestSphere(10);
      const result = generator.generate(sphere);

      expect(result.levels[0].level).toBe(0);
      expect(result.levels[0].reductionRatio).toBe(1.0);
      expect(result.levels[0].positions).toBe(sphere.positions);
    });

    it('should reduce triangle count in higher levels', () => {
      const sphere = createTestSphere(16);
      const result = generator.generate(sphere);

      expect(result.levels[1].triangleCount).toBeLessThan(result.levels[0].triangleCount);
      expect(result.levels[2].triangleCount).toBeLessThan(result.levels[1].triangleCount);
    });

    it('should track generation time', () => {
      const sphere = createTestSphere(8);
      const result = generator.generate(sphere);

      expect(result.generationTimeMs).toBeGreaterThan(0);
    });

    it('should handle empty mesh', () => {
      const empty: MeshData = {
        positions: new Float32Array([]),
        indices: new Uint32Array([]),
      };
      const result = generator.generate(empty);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateLevel', () => {
    it('should generate single level', () => {
      const sphere = createTestSphere(12);
      const level = generator.generateLevel(sphere, 0.5, 1);

      expect(level.level).toBe(1);
      expect(level.reductionRatio).toBeLessThan(1);
    });

    it('should throw for invalid mesh', () => {
      const invalid: MeshData = {
        positions: new Float32Array([]),
        indices: new Uint32Array([]),
      };

      expect(() => generator.generateLevel(invalid, 0.5)).toThrow();
    });
  });

  describe('createConfigFromLevels', () => {
    it('should create config from generated levels', () => {
      const sphere = createTestSphere(10);
      const result = generator.generate(sphere);
      const config = generator.createConfigFromLevels('test', result.levels, 10);

      expect(config.id).toBe('test');
      expect(config.levels).toHaveLength(3);
      expect(config.strategy).toBe('distance');
    });

    it('should set appropriate distances', () => {
      const sphere = createTestSphere(10);
      const result = generator.generate(sphere);
      const config = generator.createConfigFromLevels('test', result.levels, 10);

      expect(config.levels[0].distance).toBe(0);
      expect(config.levels[1].distance).toBe(10);
      expect(config.levels[2].distance).toBe(20);
    });
  });

  describe('options', () => {
    it('should update options', () => {
      generator.setOptions({ levelCount: 5 });
      expect(generator.getOptions().levelCount).toBe(5);
    });
  });
});

// ============================================================================
// LOD Generator Factory Tests
// ============================================================================

describe('LOD Generator Factories', () => {
  describe('createLODGenerator', () => {
    it('should create generator with defaults', () => {
      const generator = createLODGenerator();
      expect(generator.getOptions().levelCount).toBe(3);
    });

    it('should create generator with custom options', () => {
      const generator = createLODGenerator({ levelCount: 4 });
      expect(generator.getOptions().levelCount).toBe(4);
    });
  });

  describe('generateLODs', () => {
    it('should generate LODs with specified level count', () => {
      const sphere = createTestSphere(8);
      const result = generateLODs(sphere, 4);

      expect(result.success).toBe(true);
      expect(result.levels).toHaveLength(4);
    });
  });
});

// ============================================================================
// Test Mesh Factory Tests
// ============================================================================

describe('Test Mesh Factories', () => {
  describe('createTestCube', () => {
    it('should create valid cube mesh', () => {
      const cube = createTestCube();

      expect(cube.positions).toBeInstanceOf(Float32Array);
      expect(cube.indices).toBeInstanceOf(Uint32Array);
      expect(cube.positions.length).toBe(24 * 3); // 24 vertices
      expect(cube.indices.length).toBe(12 * 3); // 12 triangles
    });
  });

  describe('createTestSphere', () => {
    it('should create valid sphere mesh', () => {
      const sphere = createTestSphere(8);

      expect(sphere.positions).toBeInstanceOf(Float32Array);
      expect(sphere.indices).toBeInstanceOf(Uint32Array);
      expect(sphere.positions.length).toBeGreaterThan(0);
      expect(sphere.indices.length).toBeGreaterThan(0);
    });

    it('should create higher-poly sphere with more segments', () => {
      const lowPoly = createTestSphere(8);
      const highPoly = createTestSphere(16);

      expect(highPoly.positions.length).toBeGreaterThan(lowPoly.positions.length);
      expect(highPoly.indices.length).toBeGreaterThan(lowPoly.indices.length);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('LOD System Integration', () => {
  it('should work end-to-end: generate LODs, create config, manage with LODManager', () => {
    // 1. Create mesh
    const sphere = createTestSphere(12);

    // 2. Generate LODs
    const generator = new LODGenerator({ levelCount: 3 });
    const generationResult = generator.generate(sphere);
    expect(generationResult.success).toBe(true);

    // 3. Create config from levels
    const config = generator.createConfigFromLevels('testObject', generationResult.levels, 10);
    expect(config.levels).toHaveLength(3);

    // 4. Register with manager
    const manager = new LODManager();
    manager.registerConfig('testObject', config);
    expect(manager.getConfig('testObject')).toBeDefined();

    // 5. Simulate camera movement and update
    manager.setCameraPosition([0, 0, 5]);
    manager.update(0.016);
    expect(manager.getCurrentLevel('testObject')).toBe(0);

    // 6. Move camera far away
    manager.setCameraPosition([0, 0, 100]);
    manager.setForcedLevel('testObject', 2);
    manager.update(0.016);
    expect(manager.getCurrentLevel('testObject')).toBe(2);

    // 7. Check metrics
    const metrics = manager.getMetrics();
    expect(metrics.totalObjects).toBe(1);
  });

  it('should handle multiple objects with group', () => {
    const manager = new LODManager();
    const config = createStandardLODConfig('group', 3);

    // Create group with multiple objects
    const group = createLODGroup(
      'building_cluster',
      'Building Cluster',
      ['building_1', 'building_2', 'building_3'],
      config,
      [0, 0, 0],
      20
    );

    manager.createGroup(group);

    expect(manager.getGroups()).toContain('building_cluster');
    expect(manager.getGroup('building_cluster')?.objectIds).toHaveLength(3);
  });
});
