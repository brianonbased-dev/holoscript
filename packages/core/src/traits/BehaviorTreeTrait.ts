/**
 * BehaviorTree Trait
 *
 * Declarative behavior tree definition
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

export const behaviorTreeHandler: TraitHandler<any> = {
  name: 'behavior_tree' as any,

  defaultConfig: { root: { type: 'sequence', children: [] }, tick_rate: 10, debug_visualization: false, blackboard: {}, restart_on_complete: true },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { currentNode: null, status: 'running', tickCount: 0 };
    (node as any).__behaviorTreeState = state;
  },

  onDetach(node) {
    delete (node as any).__behaviorTreeState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__behaviorTreeState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__behaviorTreeState;
    if (!state) return;
  },
};

export default behaviorTreeHandler;
