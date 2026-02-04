/**
 * MaterialX Trait
 *
 * MaterialX material description support
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

export const materialXHandler: TraitHandler<any> = {
  name: 'material_x' as any,

  defaultConfig: { source: '', material_name: '', node_graph: '', color_space: 'srgb', shading_model: 'standard_surface' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isLoaded: false, materialId: null };
    (node as any).__materialXState = state;
  },

  onDetach(node) {
    delete (node as any).__materialXState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__materialXState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_format_converted', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__materialXState;
    if (!state) return;
  },
};

export default materialXHandler;
