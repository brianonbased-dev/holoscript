/**
 * ClothTrait Tests
 *
 * Tests for cloth physics simulation using position-based dynamics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clothHandler } from '../ClothTrait';
import {
  createMockContext,
  createMockNode,
  attachTrait,
  sendEvent,
  updateTrait,
  getLastEvent,
  getEventCount,
} from './traitTestHelpers';

describe('ClothTrait', () => {
  let node: Record<string, unknown>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    node = createMockNode('cloth-node');
    ctx = createMockContext();
  });

  describe('initialization', () => {
    it('should have correct default config', () => {
      expect(clothHandler.defaultConfig.resolution).toBe(32);
      expect(clothHandler.defaultConfig.stiffness).toBe(0.8);
      expect(clothHandler.defaultConfig.gravity_scale).toBe(1.0);
    });

    it('should attach and create state', () => {
      attachTrait(clothHandler, node, {}, ctx);

      expect((node as any).__clothState).toBeDefined();
      expect((node as any).__clothState.vertices).toBeDefined();
      expect((node as any).__clothState.constraints).toBeDefined();
    });

    it('should initialize vertices based on resolution', () => {
      attachTrait(clothHandler, node, { resolution: 4 }, ctx);

      const state = (node as any).__clothState;
      expect(state.vertices.length).toBe(4); // 4 rows
      expect(state.vertices[0].length).toBe(4); // 4 cols
    });

    it('should emit cloth_create on attach', () => {
      attachTrait(clothHandler, node, { resolution: 3 }, ctx);

      const createEvent = getLastEvent(ctx, 'cloth_create');
      expect(createEvent).toBeDefined();
      expect(createEvent.resolution).toBe(3);
    });
  });

  describe('physics simulation', () => {
    beforeEach(() => {
      attachTrait(clothHandler, node, { resolution: 3, wind_response: 0.5 }, ctx);
      ctx.clearEvents();
    });

    it('should apply wind force during update', () => {
      const state = (node as any).__clothState;
      state.windForce = { x: 1, y: 0, z: 0 };

      updateTrait(clothHandler, node, { resolution: 3, wind_response: 0.5 }, ctx, 16.67);

      expect(getEventCount(ctx, 'cloth_apply_force')).toBe(1);
    });

    it('should emit cloth_step during update', () => {
      updateTrait(clothHandler, node, { resolution: 3 }, ctx, 16.67);

      expect(getEventCount(ctx, 'cloth_step')).toBe(1);
    });
  });

  describe('pinning', () => {
    beforeEach(() => {
      attachTrait(clothHandler, node, { resolution: 3 }, ctx);
      ctx.clearEvents();
    });

    it('should pin vertex at grid position', () => {
      sendEvent(clothHandler, node, { resolution: 3 }, ctx, {
        type: 'cloth_pin_vertex',
        x: 0,
        y: 0,
      });

      const state = (node as any).__clothState;
      expect(state.vertices[0][0].isPinned).toBe(true);
    });

    it('should unpin vertex', () => {
      // First pin
      sendEvent(clothHandler, node, { resolution: 3 }, ctx, {
        type: 'cloth_pin_vertex',
        x: 0,
        y: 0,
      });

      // Then unpin
      sendEvent(clothHandler, node, { resolution: 3 }, ctx, {
        type: 'cloth_unpin_vertex',
        x: 0,
        y: 0,
      });

      const state = (node as any).__clothState;
      expect(state.vertices[0][0].isPinned).toBe(false);
    });
  });

  describe('wind force', () => {
    beforeEach(() => {
      attachTrait(clothHandler, node, { resolution: 3 }, ctx);
      ctx.clearEvents();
    });

    it('should apply wind force', () => {
      sendEvent(clothHandler, node, { resolution: 3 }, ctx, {
        type: 'wind_update',
        direction: { x: 5, y: 0, z: 0 },
      });

      const state = (node as any).__clothState;
      expect(state.windForce).toEqual({ x: 5, y: 0, z: 0 });
    });
  });

  describe('tearing', () => {
    it('should tear cloth when constraint breaks', () => {
      attachTrait(
        clothHandler,
        node,
        {
          resolution: 3,
          tearable: true,
          tear_threshold: 100,
        },
        ctx
      );
      ctx.clearEvents();

      // Send a constraint break event
      sendEvent(
        clothHandler,
        node,
        {
          resolution: 3,
          tearable: true,
          tear_threshold: 100,
        },
        ctx,
        {
          type: 'cloth_constraint_break',
          constraintIndex: 0,
        }
      );

      const state = (node as any).__clothState;
      expect(state.isTorn).toBe(true);
      expect(getEventCount(ctx, 'on_cloth_tear')).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up state on detach', () => {
      attachTrait(clothHandler, node, {}, ctx);
      clothHandler.onDetach?.(node, clothHandler.defaultConfig, ctx);

      expect((node as any).__clothState).toBeUndefined();
      expect(getEventCount(ctx, 'cloth_destroy')).toBe(1);
    });
  });
});
