/**
 * HRTF Trait
 *
 * Personalized Head-Related Transfer Function rendering
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

export const hrtfHandler: TraitHandler<any> = {
  name: 'hrtf' as any,

  defaultConfig: { profile: 'generic', database: 'cipic', custom_sofa_url: '', interpolation: 'bilinear', crossfade_time: 50 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isActive: false, currentProfile: 'generic' };
    (node as any).__hrtfState = state;
  },

  onDetach(node) {
    delete (node as any).__hrtfState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__hrtfState;
    if (!state) return;

  },

  onEvent(node, config, context, event) {
    const state = (node as any).__hrtfState;
    if (!state) return;
  },
};

export default hrtfHandler;
