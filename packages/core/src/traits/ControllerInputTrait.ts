/**
 * ControllerInput Trait
 *
 * 6DOF controller input mapping
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

export const controllerInputHandler: TraitHandler<any> = {
  name: 'controller' as any,

  defaultConfig: { haptic_on_button: true, deadzone: 0.1, button_mapping: {}, trigger_threshold: 0.5, grip_threshold: 0.5, thumbstick_sensitivity: 1.0 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isConnected: false, lastInput: 0 };
    (node as any).__controllerInputState = state;
  },

  onDetach(node) {
    delete (node as any).__controllerInputState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__controllerInputState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_controller_vibrate', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__controllerInputState;
    if (!state) return;
  },
};

export default controllerInputHandler;
