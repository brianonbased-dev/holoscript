/**
 * PressableTrait.ts
 *
 * Turns an entity into a physical 3D button.
 * Uses a Prismatic Joint (Slider) with a spring force to simulate a mechanical button.
 *
 * Properties:
 * - distance: Max depression distance (meters). Default 0.01 (1cm).
 * - spring: Spring strength.
 * - damping: Spring damping.
 * - triggerPoint: Normalized point (0-1) where 'press' event fires.
 */

import { Trait } from './Trait';
import { TraitContext } from './VRTraitSystem';

export class PressableTrait implements Trait {
  name = 'pressable';
  private isPressed: boolean = false;
  private initialPos: { x: number, y: number, z: number } | null = null; // Local offset?

  onAttach(node: any, context: TraitContext): void {
    const distance = node.properties.distance || 0.01;
    const stiffness = node.properties.stiffness || 100;
    const damping = node.properties.damping || 5;

    // Request Physics Constraint: Prismatic (Slider) along local Z
    // The anchor is the parent or world. If parent is null, it's anchored to world start pos.
    context.emit('physics_add_constraint', {
        type: 'prismatic',
        nodeId: node.id,
        axis: { x: 0, y: 0, z: 1 }, // Local Z
        min: 0,
        max: distance,
        spring: { stiffness, damping, restLength: 0 } // Spring pulls back to 0
    });
  }

  onUpdate(node: any, context: TraitContext, delta: number): void {
    // We need to know the current physical offset along the axis
    // Ideally, the Runtime updates `node.properties.position` or specific physics state
    // Let's assume `node.params.depression` or we calculate magnitude of offset from initial
    
    // For now, we assume the Runtime/PhysicsEngine updates a specialized property for constrained bodies
    // OR we rely on reading position relative to parent.
    
    // Simplification: We blindly trust the event system for now, OR we read the node's position if updated.
    // If physics updates node.position, checking Z local deviation works.
    
    // Mock logic for detection (Real logic needs relative transform math):
    // const depression = ...;
    
    // if (!this.isPressed && depression > triggerPoint) {
    //    this.isPressed = true;
    //    context.emit('ui_press_start', { nodeId: node.id });
    // } else if (this.isPressed && depression < releasePoint) {
    //    this.isPressed = false;
    //    context.emit('ui_press_end', { nodeId: node.id });
    // }
  }
}
