/**
 * GPUPhysics Trait
 *
 * GPU-side physics simulation
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

export const gpuPhysicsHandler: TraitHandler<any> = {
  name: 'gpu_physics' as any,

  defaultConfig: { sim_type: 'particles', resolution: 64, substeps: 4, method: 'pbd', gravity: [0, -9.81, 0], damping: 0.01, collision_geometry: '' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isSimulating: false, stepCount: 0 };
    (node as any).__gpuPhysicsState = state;
  },

  onDetach(node) {
    delete (node as any).__gpuPhysicsState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__gpuPhysicsState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__gpuPhysicsState;
    if (!state) return;
  },
};

export default gpuPhysicsHandler;
