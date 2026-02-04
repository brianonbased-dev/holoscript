/**
 * Fluid Trait
 *
 * Fluid dynamics simulation
 *
 * @version 1.0.0
 */

import type { TraitHandler } from './TraitTypes';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// HANDLER
// =============================================================================

export const fluidHandler: TraitHandler<any> = {
  name: 'fluid' as any,

  defaultConfig: { method: 'sph', particle_count: 10000, viscosity: 0.01, surface_tension: 0.07, density: 1000, gravity: [0, -9.81, 0], render_mode: 'particles' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isSimulating: false, particleCount: 0 };
    (node as any).__fluidState = state;
  },

  onDetach(node) {
    delete (node as any).__fluidState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__fluidState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_fluid_splash', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__fluidState;
    if (!state) return;
  },
};

export default fluidHandler;
