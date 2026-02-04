/**
 * Sensor Trait
 *
 * Bind to IoT data stream
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

export const sensorHandler: TraitHandler<any> = {
  name: 'sensor' as any,

  defaultConfig: { protocol: 'rest', endpoint: '', topic: '', data_type: 'number', update_interval: 1000, unit: '', range: { min: 0, max: 100 } },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { currentValue: 0, lastUpdate: 0, isConnected: false };
    (node as any).__sensorState = state;
  },

  onDetach(node) {
    delete (node as any).__sensorState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__sensorState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_sensor_update', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__sensorState;
    if (!state) return;
  },
};

export default sensorHandler;
