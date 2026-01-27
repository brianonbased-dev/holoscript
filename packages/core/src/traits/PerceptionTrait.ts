/**
 * Perception Trait
 *
 * Agent sensory system for awareness
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

export const perceptionHandler: TraitHandler<any> = {
  name: 'perception' as any,

  defaultConfig: { sight_range: 20, sight_angle: 120, hearing_range: 15, memory_duration: 10000, detection_layers: [], los_check: true, peripheral_vision: true, alert_radius: 5 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { perceivedEntities: new Map(), lastPerceptionUpdate: 0 };
    (node as any).__perceptionState = state;
  },

  onDetach(node) {
    delete (node as any).__perceptionState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__perceptionState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_perception_change', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__perceptionState;
    if (!state) return;
  },
};

export default perceptionHandler;
