/**
 * POI Trait
 *
 * Point of interest with proximity triggers
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

export const poiHandler: TraitHandler<any> = {
  name: 'poi' as any,

  defaultConfig: { name: '', description: '', category: '', icon: '', trigger_radius: 10, visible_radius: 100, navigation_target: false, metadata: {} },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isInRange: false, distanceToUser: Infinity };
    (node as any).__poiState = state;
  },

  onDetach(node) {
    delete (node as any).__poiState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__poiState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_poi_proximity', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__poiState;
    if (!state) return;
  },
};

export default poiHandler;
