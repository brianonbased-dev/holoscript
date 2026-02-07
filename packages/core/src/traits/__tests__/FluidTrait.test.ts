/**
 * FluidTrait Tests
 *
 * Tests for fluid dynamics simulation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { fluidHandler } from '../FluidTrait';
import {
  createMockContext,
  createMockNode,
  attachTrait,
  sendEvent,
  getLastEvent,
  getEventCount,
} from './traitTestHelpers';

describe('FluidTrait', () => {
  let node: Record<string, unknown>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    node = createMockNode('fluid-node');
    ctx = createMockContext();
  });

  describe('initialization', () => {
    it('should have correct default config', () => {
      expect(fluidHandler.defaultConfig.viscosity).toBe(0.01);
      expect(fluidHandler.defaultConfig.density).toBe(1000);
      expect(fluidHandler.defaultConfig.particle_count).toBe(10000);
    });

    it('should attach and initialize state', () => {
      attachTrait(fluidHandler, node, {}, ctx);

      const state = (node as any).__fluidState;
      expect(state).toBeDefined();
      expect(state.isSimulating).toBe(true);
    });

    it('should emit fluid_create on attach', () => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 500,
        },
        ctx
      );

      expect(getEventCount(ctx, 'fluid_create')).toBe(1);
    });
  });

  describe('simulation', () => {
    beforeEach(() => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 100,
        },
        ctx
      );
      ctx.clearEvents();
    });

    it('should be simulating after attach', () => {
      const state = (node as any).__fluidState;
      expect(state.isSimulating).toBe(true);
    });

    it('should pause simulation', () => {
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_pause',
      });

      const state = (node as any).__fluidState;
      expect(state.isSimulating).toBe(false);
    });

    it('should resume simulation', () => {
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_pause',
      });
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_resume',
      });

      const state = (node as any).__fluidState;
      expect(state.isSimulating).toBe(true);
    });
  });

  describe('emitters', () => {
    beforeEach(() => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 1000,
        },
        ctx
      );
      ctx.clearEvents();
    });

    it('should add emitter', () => {
      sendEvent(fluidHandler, node, { particle_count: 1000 }, ctx, {
        type: 'fluid_add_emitter',
        emitterId: 'emitter-1',
        position: { x: 0, y: 2, z: 0 },
        velocity: { x: 0, y: -1, z: 0 },
        rate: 10,
      });

      const state = (node as any).__fluidState;
      expect(state.emitters.size).toBe(1);
    });

    it('should remove emitter', () => {
      sendEvent(fluidHandler, node, { particle_count: 1000 }, ctx, {
        type: 'fluid_add_emitter',
        emitterId: 'emitter-1',
        position: { x: 0, y: 2, z: 0 },
        rate: 10,
      });
      ctx.clearEvents();

      sendEvent(fluidHandler, node, { particle_count: 1000 }, ctx, {
        type: 'fluid_remove_emitter',
        emitterId: 'emitter-1',
      });

      const state = (node as any).__fluidState;
      expect(state.emitters.size).toBe(0);
    });
  });

  describe('splash', () => {
    beforeEach(() => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 100,
        },
        ctx
      );
      ctx.clearEvents();
    });

    it('should handle splash event', () => {
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_splash',
        position: { x: 0, y: 0, z: 0 },
        force: 10,
        radius: 0.5,
      });

      expect(getEventCount(ctx, 'on_fluid_splash')).toBe(1);
    });
  });

  describe('bounds', () => {
    beforeEach(() => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 100,
        },
        ctx
      );
      ctx.clearEvents();
    });

    it('should set bounds', () => {
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_set_bounds',
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 },
      });

      const state = (node as any).__fluidState;
      expect(state.boundingBox.min.x).toBe(-2);
      expect(state.boundingBox.max.x).toBe(2);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 100,
        },
        ctx
      );
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_add_emitter',
        emitterId: 'test',
        position: { x: 0, y: 0, z: 0 },
        rate: 10,
      });
      ctx.clearEvents();
    });

    it('should reset fluid state', () => {
      sendEvent(fluidHandler, node, { particle_count: 100 }, ctx, {
        type: 'fluid_reset',
      });

      const state = (node as any).__fluidState;
      expect(state.particleCount).toBe(0);
      expect(state.emitters.size).toBe(0);
      expect(getEventCount(ctx, 'fluid_clear')).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up on detach', () => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 50,
        },
        ctx
      );

      fluidHandler.onDetach?.(node, fluidHandler.defaultConfig, ctx);

      expect((node as any).__fluidState).toBeUndefined();
    });
  });

  describe('query', () => {
    it('should respond to query event', () => {
      attachTrait(
        fluidHandler,
        node,
        {
          particle_count: 100,
          viscosity: 1.5,
        },
        ctx
      );
      ctx.clearEvents();

      sendEvent(fluidHandler, node, { particle_count: 100, viscosity: 1.5 }, ctx, {
        type: 'fluid_query',
        queryId: 'test-query',
      });

      const info = getLastEvent(ctx, 'fluid_info');
      expect(info).toBeDefined();
      expect(info.queryId).toBe('test-query');
      expect(info.isSimulating).toBe(true);
    });
  });
});
