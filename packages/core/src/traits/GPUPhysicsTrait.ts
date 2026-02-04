/**
 * GPUPhysics Trait
 *
 * GPU-side physics simulation
 *
 * @version 1.0.0
 */

import type { TraitHandler } from './TraitTypes';
import { getPhysicsEngine } from '../runtime/PhysicsEngine';
import { IslandDetector } from '../physics/IslandDetector';

/**
 * GPUPhysics Trait
 *
 * GPU-side physics simulation bridge.
 * Uses the PhysicsEngine @builtin to offload simulation to GPU.
 */

export interface GPUPhysicsConfig {
  sim_type?: 'particles' | 'rigid_body' | 'soft_body';
  method?: 'pbd' | 'xpbd' | 'impulse';
  gravity?: [number, number, number];
  substeps?: number;
  mass?: number;
  shape?: 'box' | 'sphere' | 'capsule' | 'mesh';
  shapeParams?: number[];
  friction?: number;
  restitution?: number;
  isStatic?: boolean;
}

interface InternalState {
  engineId: string;
  isSimulating: boolean;
  lastPosition: [number, number, number];
  islandDetector: IslandDetector;
}

export const gpuPhysicsHandler: TraitHandler<GPUPhysicsConfig> = {
  name: 'gpu_physics' as any,

  defaultConfig: {
    sim_type: 'rigid_body',
    method: 'pbd',
    gravity: [0, -9.81, 0],
    substeps: 4,
    mass: 1.0,
    shape: 'box',
    shapeParams: [1, 1, 1],
    friction: 0.5,
    restitution: 0.3,
    isStatic: false
  },

  onAttach(node, config, context) {
    const engine = getPhysicsEngine('webgpu') || getPhysicsEngine('default');
    if (!engine) {
      console.warn('No GPU PhysicsEngine found. Physics will be disabled for', node.name);
      return;
    }

    const state: InternalState = {
      engineId: 'webgpu', // Fallback or from config
      isSimulating: true,
      lastPosition: [0, 0, 0],
      islandDetector: new IslandDetector()
    };
    (node as any).__gpuPhysicsState = state;

    // Register body in GPU engine
    engine?.addBody(node.name || '', {
      type: config.isStatic ? 'static' : 'dynamic',
      mass: config.mass ?? 1.0,
      position: [0, 0, 0], // TODO: Get relative position from node
      rotation: [0, 0, 0, 1],
      shape: config.shape ?? 'box',
      shapeParams: config.shapeParams ?? [1, 1, 1],
      friction: config.friction,
      restitution: config.restitution
    });
  },

  onDetach(node) {
    const state = (node as any).__gpuPhysicsState as InternalState;
    if (state) {
      const engine = getPhysicsEngine(state.engineId);
      engine?.removeBody(node.name || '');
      delete (node as any).__gpuPhysicsState;
    }
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__gpuPhysicsState as InternalState;
    if (!state || !state.isSimulating) return;

    const engine = getPhysicsEngine(state.engineId);
    if (!engine) return;

    // The actual step happens globally in the runtime, 
    // here we just sync state back to the node if needed or apply per-node forces.
    const states = engine.getStates();
    const bodyState = states[node.name || ''];

    if (bodyState && !bodyState.isSleeping) {
      // Sync GPU position/rotation back to the node
      // This allows HoloScript code and animations to track the physics
      (node as any).position = bodyState.position as any;
      (node as any).rotation = bodyState.rotation as any;
    }
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__gpuPhysicsState as InternalState;
    if (!state) return;

    const eventType = typeof event === 'string' ? event : event.type;
    if (eventType === 'apply-force') {
      const engine = getPhysicsEngine(state.engineId || 'webgpu');
      engine?.applyForce(node.name || '', (event as any).data.force, (event as any).data.point);
    }
  },
};

export default gpuPhysicsHandler;
