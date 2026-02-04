/**
 * TerrainAnchor Trait
 *
 * Ground-relative positioning
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

export const terrainAnchorHandler: TraitHandler<any> = {
  name: 'terrain_anchor' as any,

  defaultConfig: { latitude: 0, longitude: 0, elevation_offset: 0, terrain_following: true, surface_normal_alignment: true },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isResolved: false, terrainHeight: 0 };
    (node as any).__terrainAnchorState = state;
  },

  onDetach(node) {
    delete (node as any).__terrainAnchorState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__terrainAnchorState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_terrain_resolved', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__terrainAnchorState;
    if (!state) return;
  },
};

export default terrainAnchorHandler;
