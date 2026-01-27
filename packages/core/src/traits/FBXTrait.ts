/**
 * FBX Trait
 *
 * FBX format import
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

export const fbxHandler: TraitHandler<any> = {
  name: 'fbx' as any,

  defaultConfig: { source: '', animation_stack: '', embed_textures: true, scale_factor: 1.0, up_axis: 'y' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isLoaded: false };
    (node as any).__fbxState = state;
  },

  onDetach(node) {
    delete (node as any).__fbxState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__fbxState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_asset_loaded', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__fbxState;
    if (!state) return;
  },
};

export default fbxHandler;
