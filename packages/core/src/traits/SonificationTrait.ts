/**
 * Sonification Trait
 *
 * Map data/state to audio representation
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

export const sonificationHandler: TraitHandler<any> = {
  name: 'sonification' as any,

  defaultConfig: { data_source: '', mapping: 'pitch', min_freq: 200, max_freq: 2000, pan_mode: 'spatial', continuous: false, instrument: 'sine' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { currentFrequency: 440, isActive: false };
    (node as any).__sonificationState = state;
  },

  onDetach(node) {
    delete (node as any).__sonificationState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__sonificationState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_sonification_update', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__sonificationState;
    if (!state) return;
  },
};

export default sonificationHandler;
