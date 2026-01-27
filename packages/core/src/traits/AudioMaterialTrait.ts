/**
 * AudioMaterial Trait
 *
 * Per-material acoustic properties
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

export const audioMaterialHandler: TraitHandler<any> = {
  name: 'audio_material' as any,

  defaultConfig: { absorption_coefficients: {}, reflection_coefficient: 0.5, transmission_coefficient: 0.1, scattering_coefficient: 0.3, material_preset: 'concrete' },

  onAttach(node, config, context) {
  },

  onDetach(node) {
  },

  onUpdate(node, config, context, delta) {

  },

  onEvent(node, config, context, event) {
  },
};

export default audioMaterialHandler;
