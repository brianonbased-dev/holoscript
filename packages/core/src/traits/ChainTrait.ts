/**
 * Chain Trait
 *
 * Rigid body chain constraint
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

export const chainHandler: TraitHandler<any> = {
  name: 'chain' as any,

  defaultConfig: { links: 10, link_length: 0.1, link_mass: 0.5, stiffness: 1.0, damping: 0.1, attach_start: '', attach_end: '', collision_between_links: true },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isSimulating: false };
    (node as any).__chainState = state;
  },

  onDetach(node) {
    delete (node as any).__chainState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__chainState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__chainState;
    if (!state) return;
  },
};

export default chainHandler;
