/**
 * GLTF Trait
 *
 * First-class glTF/glb support with extensions
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

export const gltfHandler: TraitHandler<any> = {
  name: 'gltf' as any,

  defaultConfig: { source: '', draco_compression: true, meshopt_compression: false, ktx2_textures: false, extensions: [], animation_clip: '', lod_levels: 1 },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isLoaded: false, meshCount: 0, animationNames: [] };
    (node as any).__gltfState = state;
  },

  onDetach(node) {
    delete (node as any).__gltfState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__gltfState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_asset_loaded', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__gltfState;
    if (!state) return;
  },
};

export default gltfHandler;
