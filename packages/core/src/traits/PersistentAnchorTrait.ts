/**
 * PersistentAnchor Trait
 *
 * Anchor that survives session restarts
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

export const persistentAnchorHandler: TraitHandler<any> = {
  name: 'persistent_anchor' as any,

  defaultConfig: { storage: 'local', ttl: 86400000, auto_resolve: true, name: '', fallback_position: [0, 0, 0] },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { persistedId: null, isResolved: false, lastResolveAttempt: 0 };
    (node as any).__persistentAnchorState = state;
  },

  onDetach(node) {
    delete (node as any).__persistentAnchorState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__persistentAnchorState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__persistentAnchorState;
    if (!state) return;
  },
};

export default persistentAnchorHandler;
