/**
 * SlidableTrait.ts
 *
 * Turns an entity into a physical slider or lever.
 *
 * Properties:
 * - axis: 'x', 'y', 'z'.
 * - length: Length of track (meters).
 * - value: Current value (0-1).
 */

import { Trait } from './Trait';
import { TraitContext } from './VRTraitSystem';

export class SlidableTrait implements Trait {
  name = 'slidable';

  onAttach(node: any, context: TraitContext): void {
    const axis = node.properties.axis || 'x';
    const length = node.properties.length || 0.1;

    let axisVec = { x: 1, y: 0, z: 0 };
    if (axis === 'y') axisVec = { x: 0, y: 1, z: 0 };
    if (axis === 'z') axisVec = { x: 0, y: 0, z: 1 };

    // Request Prismatic Constraint without spring (or weak spring/friction for "feel")
    context.emit('physics_add_constraint', {
        type: 'prismatic',
        nodeId: node.id,
        axis: axisVec,
        min: -length / 2,
        max: length / 2,
        // friction: 0.5 // TODO: Support friction in constraint event
    });
  }

  onUpdate(node: any, context: TraitContext, delta: number): void {
    // Calculate value based on position along axis
    // const value = (currentPos - min) / (max - min);
    // node.properties.value = value;
    // context.emit('ui_value_change', { nodeId: node.id, value });
  }
}
