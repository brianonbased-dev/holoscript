/**
 * HapticCue Trait
 *
 * Non-visual haptic feedback for interactions
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

export const hapticCueHandler: TraitHandler<any> = {
  name: 'haptic_cue' as any,

  defaultConfig: { pattern: 'pulse', intensity: 0.5, duration: 100, repeat: 0, spatial_direction: false },

  onAttach(node, config, context) {
  },

  onDetach(node) {
  },

  onUpdate(node, config, context, delta) {

  },

  onEvent(node, config, context, event) {
  },
};

export default hapticCueHandler;
