/**
 * CoLocated Trait
 *
 * Shared experience in same physical space
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

export const coLocatedHandler: TraitHandler<any> = {
  name: 'co_located' as any,

  defaultConfig: { shared_anchor_id: '', alignment_method: 'cloud_anchor', alignment_timeout: 30000, visual_indicator: true, max_participants: 10 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isAligned: false, participants: [] };
    (node as any).__coLocatedState = state;
  },

  onDetach(node) {
    delete (node as any).__coLocatedState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__coLocatedState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_co_presence_joined', { node });
      // context.emit('on_co_presence_left', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__coLocatedState;
    if (!state) return;
  },
};

export default coLocatedHandler;
