/**
 * HeadTrackedAudio Trait
 *
 * Audio anchored to world not head
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

export const headTrackedAudioHandler: TraitHandler<any> = {
  name: 'head_tracked_audio' as any,

  defaultConfig: { source: '', anchor_mode: 'world', tracking_latency_compensation: true, stabilization: 0.5, bypass_spatialization: false },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isPlaying: false };
    (node as any).__headTrackedAudioState = state;
  },

  onDetach(node) {
    delete (node as any).__headTrackedAudioState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__headTrackedAudioState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__headTrackedAudioState;
    if (!state) return;
  },
};

export default headTrackedAudioHandler;
