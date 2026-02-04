/**
 * RemotePresence Trait
 *
 * Telepresence with avatar representation
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

export const remotePresenceHandler: TraitHandler<any> = {
  name: 'remote_presence' as any,

  defaultConfig: { avatar_type: 'head_hands', voice_enabled: true, video_enabled: false, latency_compensation: true, quality_adaptive: true, bandwidth_limit: 0 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isConnected: false, latency: 0, peerCount: 0 };
    (node as any).__remotePresenceState = state;
  },

  onDetach(node) {
    delete (node as any).__remotePresenceState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__remotePresenceState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__remotePresenceState;
    if (!state) return;
  },
};

export default remotePresenceHandler;
