/**
 * GrabbableTrait.ts
 *
 * Makes an object grabbable by VR hands.
 * Uses physics joints to attach the object to the hand when pinched.
 */

import { Trait } from './Trait';
import { TraitContext } from './VRTraitSystem';
import { VRHand, Vector3 } from '../types/HoloScriptPlus';

export class GrabbableTrait implements Trait {
  name = 'grabbable';
  private grabbedHands: Set<string> = new Set();
  private initialPinchDistance: number = 0;
  private initialScale: Vector3 = { x: 1, y: 1, z: 1 };
  
  onUpdate(node: any, context: TraitContext, delta: number): void {
    const hands = context.vr.hands;
    
    // Check Releases
    for (const handName of this.grabbedHands) {
        const hand = handName === 'left' ? hands.left : hands.right;
        if (hand && hand.pinchStrength < 0.5) {
            this.release(node, context, handName, hand);
        }
    }

    // Check Grabs (if not already grabbed by this hand)
    if (!this.grabbedHands.has('left')) this.checkHandInteraction(node, context, hands.left, 'left');
    if (!this.grabbedHands.has('right')) this.checkHandInteraction(node, context, hands.right, 'right');

    // Two-Handed Manipulation
    if (this.grabbedHands.size === 2 && hands.left && hands.right) {
        this.updateTwoHanded(node, hands.left, hands.right);
    }
  }

  private checkHandInteraction(node: any, context: TraitContext, hand: VRHand | null, side: string): void {
    if (!hand) return;
    const dist = this.getDistance(node.properties.position, hand.position);
    
    if (dist < 0.1) {
      if (hand.pinchStrength > 0.9) {
        this.grab(node, context, side, hand);
      }
    }
  }

  private grab(node: any, context: TraitContext, side: string, hand: VRHand): void {
    this.grabbedHands.add(side);
    
    if (this.grabbedHands.size === 2) {
        // Enter Manipulation Mode
        const hands = context.vr.hands;
        if (hands.left && hands.right) {
            this.initialPinchDistance = this.getDistance(hands.left.position, hands.right.position);
            this.initialScale = { ...node.properties.scale } || { x: 1, y: 1, z: 1 };
            // Optional: Release physics constraints to allow smooth scaling
            context.emit('physics_release', { nodeId: node.id }); 
        }
    } else {
        // Single Hand Grab - Physics Constraint
        context.emit('physics_grab', { nodeId: node.id, hand: side });
    }
  }

  private release(node: any, context: TraitContext, side: string, hand: VRHand): void {
    this.grabbedHands.delete(side);
    
    if (this.grabbedHands.size === 1) {
        // Re-enter Single Hand Physics Mode with remaining hand
        const remainingHand = Array.from(this.grabbedHands)[0];
        context.emit('physics_grab', { nodeId: node.id, hand: remainingHand });
    } else {
        // Full Release
        context.emit('physics_release', { 
            nodeId: node.id, 
            hand: side, // Just pass one hand for velocity calculation
            velocity: this.calculateThrowVelocity(hand) 
        });
    }
  }

  private updateTwoHanded(node: any, left: VRHand, right: VRHand): void {
      const currentDist = this.getDistance(left.position, right.position);
      const scaleFactor = currentDist / this.initialPinchDistance;
      
      const newScale = {
          x: this.initialScale.x * scaleFactor,
          y: this.initialScale.y * scaleFactor,
          z: this.initialScale.z * scaleFactor
      };
      
      node.properties.scale = newScale;
      // TODO: Emit scale update to physics engine if body needs resizing
  }

  private getDistance(p1: any, p2: any): number {
    const dx = p1.x ? (p1.x - p2.x) : (p1[0] - p2.x); // Handle array vs object props
    const dy = p1.y ? (p1.y - p2.y) : (p1[1] - p2.y);
    const dz = p1.z ? (p1.z - p2.z) : (p1[2] - p2.z);
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  private calculateThrowVelocity(hand: VRHand): [number, number, number] {
     return [0, 0, 0];
  }

  onDetach(node: any, context: TraitContext): void {
    if (this.grabbedHands.size > 0) {
        context.emit('physics_release', { nodeId: node.id });
    }
  }
}
