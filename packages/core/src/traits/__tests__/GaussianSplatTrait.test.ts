/**
 * GaussianSplatTrait Tests
 *
 * Tests for 3D Gaussian Splatting rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { gaussianSplatHandler } from '../GaussianSplatTrait';
import {
  createMockContext,
  createMockNode,
  attachTrait,
  sendEvent,
  updateTrait,
  getLastEvent,
  getEventCount,
} from './traitTestHelpers';

describe('GaussianSplatTrait', () => {
  let node: Record<string, unknown>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    node = createMockNode('splat-node');
    ctx = createMockContext();
  });

  describe('initialization', () => {
    it('should have correct default config', () => {
      expect(gaussianSplatHandler.defaultConfig.quality).toBe('medium');
      expect(gaussianSplatHandler.defaultConfig.sort_mode).toBe('distance');
      expect(gaussianSplatHandler.defaultConfig.streaming).toBe(false);
    });

    it('should attach and create state', () => {
      attachTrait(gaussianSplatHandler, node, {}, ctx);

      const state = (node as any).__gaussianSplatState;
      expect(state).toBeDefined();
      expect(state.isLoaded).toBe(false);
      expect(state.splatCount).toBe(0);
    });

    it('should start loading if source provided', () => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);

      const state = (node as any).__gaussianSplatState;
      expect(state.isLoading).toBe(true);
    });
  });

  describe('loading', () => {
    beforeEach(() => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);
      ctx.clearEvents();
    });

    it('should handle load complete', () => {
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 100000,
        memoryUsage: 1024000,
        boundingBox: { min: [-5, -5, -5], max: [5, 5, 5] },
        renderHandle: {},
      });

      const state = (node as any).__gaussianSplatState;
      expect(state.isLoaded).toBe(true);
      expect(state.splatCount).toBe(100000);
      expect(getEventCount(ctx, 'on_splat_loaded')).toBe(1);
    });

    it('should handle load progress', () => {
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_progress',
        progress: 0.5,
        loadedSplats: 50000,
      });

      expect(getEventCount(ctx, 'on_splat_progress')).toBe(1);
    });
  });

  describe('quality settings', () => {
    beforeEach(() => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 100000,
        memoryUsage: 1024000,
        boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
        renderHandle: {},
      });
      ctx.clearEvents();
    });

    it('should request quality change', () => {
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_set_quality',
        quality: 'high',
      });

      expect(getEventCount(ctx, 'splat_update_quality')).toBe(1);
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 100000,
        memoryUsage: 1024000,
        boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
        renderHandle: {},
      });
      ctx.clearEvents();
    });

    it('should be loaded after load complete', () => {
      const state = (node as any).__gaussianSplatState;
      expect(state.isLoaded).toBe(true);
    });
  });

  describe('visibility', () => {
    beforeEach(() => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 100000,
        memoryUsage: 1024000,
        boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
        renderHandle: {},
      });
      ctx.clearEvents();
    });

    it('should track visible splat count', () => {
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_visibility_update',
        visibleCount: 50000,
      });

      const state = (node as any).__gaussianSplatState;
      expect(state.visibleSplats).toBe(50000);
    });
  });

  describe('memory management', () => {
    it('should clean up on detach', () => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx);
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 100000,
        memoryUsage: 1024000,
        boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
        renderHandle: {},
      });
      ctx.clearEvents();

      gaussianSplatHandler.onDetach?.(node, gaussianSplatHandler.defaultConfig, ctx);

      expect((node as any).__gaussianSplatState).toBeUndefined();
      expect(getEventCount(ctx, 'splat_destroy')).toBe(1);
    });
  });

  describe('query', () => {
    it('should respond to query event', () => {
      attachTrait(gaussianSplatHandler, node, { source: 'scene.ply', quality: 'high' }, ctx);
      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply', quality: 'high' }, ctx, {
        type: 'splat_load_complete',
        splatCount: 50000,
        memoryUsage: 512000,
        boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
        renderHandle: {},
      });
      ctx.clearEvents();

      sendEvent(gaussianSplatHandler, node, { source: 'scene.ply', quality: 'high' }, ctx, {
        type: 'splat_query',
        queryId: 'test-query',
      });

      const info = getLastEvent(ctx, 'splat_info');
      expect(info).toBeDefined();
      expect(info.queryId).toBe('test-query');
      expect(info.isLoaded).toBe(true);
      expect(info.splatCount).toBe(50000);
    });
  });
});
