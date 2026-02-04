/**
 * MotionReduced Trait
 *
 * Reduced motion for vestibular sensitivity
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

export const motionReducedHandler: TraitHandler<any> = {
  name: 'motion_reduced' as any,

  defaultConfig: { disable_parallax: true, reduce_animations: true, static_ui: false, max_velocity: 2, disable_camera_shake: true, teleport_instead_of_smooth: true },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isActive: false };
    (node as any).__motionReducedState = state;
  },

  onDetach(node) {
    delete (node as any).__motionReducedState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__motionReducedState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_motion_reduce', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__motionReducedState;
    if (!state) return;
  },
};

export default motionReducedHandler;
