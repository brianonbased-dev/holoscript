/**
 * Ambisonics Trait
 *
 * Higher-order ambisonic encoding/decoding
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

export const ambisonicsHandler: TraitHandler<any> = {
  name: 'ambisonics' as any,

  defaultConfig: { order: 1, normalization: 'sn3d', channel_ordering: 'acn', decoder: 'binaural', source: '' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isPlaying: false, currentOrder: 1 };
    (node as any).__ambisonicsState = state;
  },

  onDetach(node) {
    delete (node as any).__ambisonicsState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__ambisonicsState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__ambisonicsState;
    if (!state) return;
  },
};

export default ambisonicsHandler;
