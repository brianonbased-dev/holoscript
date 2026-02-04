/**
 * Compute Trait
 *
 * Declare a GPU compute shader workload
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

export const computeHandler: TraitHandler<any> = {
  name: 'compute' as any,

  defaultConfig: { workgroup_size: [64, 1, 1], dispatch: [1, 1, 1], shader_source: '', bindings: {}, auto_dispatch: false },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isReady: false, lastDispatchTime: 0 };
    (node as any).__computeState = state;
  },

  onDetach(node) {
    delete (node as any).__computeState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__computeState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_compute_complete', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__computeState;
    if (!state) return;
  },
};

export default computeHandler;
