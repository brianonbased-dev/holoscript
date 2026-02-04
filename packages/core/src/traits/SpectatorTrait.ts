/**
 * Spectator Trait
 *
 * View-only participant mode
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

export const spectatorHandler: TraitHandler<any> = {
  name: 'spectator' as any,

  defaultConfig: { camera_mode: 'free', follow_target: '', can_interact: false, visible_to_participants: false, max_spectators: 50, delay: 0 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isSpectating: false, spectatorCount: 0 };
    (node as any).__spectatorState = state;
  },

  onDetach(node) {
    delete (node as any).__spectatorState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__spectatorState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_spectator_join', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__spectatorState;
    if (!state) return;
  },
};

export default spectatorHandler;
