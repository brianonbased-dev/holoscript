/**
 * GeospatialEnv Trait
 *
 * GPS/lat-lon world-scale anchoring
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

export const geospatialEnvHandler: TraitHandler<any> = {
  name: 'geospatial' as any,

  defaultConfig: { latitude: 0, longitude: 0, altitude: 0, altitude_type: 'terrain', heading: 0, heading_alignment: true, accuracy_threshold: 5 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isLocalized: false, accuracy: Infinity };
    (node as any).__geospatialEnvState = state;
  },

  onDetach(node) {
    delete (node as any).__geospatialEnvState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__geospatialEnvState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__geospatialEnvState;
    if (!state) return;
  },
};

export default geospatialEnvHandler;
