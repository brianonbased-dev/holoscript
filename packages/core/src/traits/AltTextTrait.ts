/**
 * AltText Trait
 *
 * Alternative text description for 3D objects
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

export const altTextHandler: TraitHandler<any> = {
  name: 'alt_text' as any,

  defaultConfig: { text: '', verbose: '', language: 'en', auto_generate: false },

  onAttach(node, config, context) {
  },

  onDetach(node) {
  },

  onUpdate(node, config, context, delta) {

  },

  onEvent(node, config, context, event) {
  },
};

export default altTextHandler;
