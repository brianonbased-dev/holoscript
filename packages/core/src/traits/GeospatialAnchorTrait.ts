/**
 * GeospatialAnchor Trait
 *
 * Lat/lon/alt world anchoring
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

export const geospatialAnchorHandler: TraitHandler<any> = {
  name: 'geospatial_anchor' as any,

  defaultConfig: { latitude: 0, longitude: 0, altitude: 0, altitude_type: 'terrain', heading: 0, accuracy_threshold: 10, visual_indicator: false },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isResolved: false, accuracy: Infinity };
    (node as any).__geospatialAnchorState = state;
  },

  onDetach(node) {
    delete (node as any).__geospatialAnchorState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__geospatialAnchorState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__geospatialAnchorState;
    if (!state) return;
  },
};

export default geospatialAnchorHandler;
