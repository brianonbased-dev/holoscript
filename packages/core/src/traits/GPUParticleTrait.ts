/**
 * GPUParticle Trait
 *
 * GPU-accelerated particle system
 *
 * @version 1.0.0
 */

import type { TraitHandler } from './VRTraitSystem';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// HANDLER
// =============================================================================

export const gpuParticleHandler: TraitHandler<any> = {
  name: 'gpu_particle' as any,

  defaultConfig: { count: 10000, emission_rate: 1000, lifetime: 2.0, forces: [], color_over_life: [], size_over_life: [], collision: false, spatial_hash: false },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { activeCount: 0, isEmitting: true };
    (node as any).__gpuParticleState = state;
  },

  onDetach(node) {
    delete (node as any).__gpuParticleState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__gpuParticleState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__gpuParticleState;
    if (!state) return;
  },
};

export default gpuParticleHandler;
