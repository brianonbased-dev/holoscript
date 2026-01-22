/**
 * Physics Integration for HoloScript Three.js Adapter
 *
 * Provides physics simulation using Rapier3D
 * with automatic sync to Three.js objects.
 *
 * Rapier is an optional peer dependency - physics features
 * are only available when @dimforge/rapier3d is installed.
 */

import * as THREE from 'three';

// Use any for Rapier types since it's optional
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RAPIER = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RapierWorld = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RigidBody = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Collider = any;

/**
 * Physics body configuration
 */
export interface PhysicsBodyConfig {
  type: 'static' | 'dynamic' | 'kinematic';
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  colliderType?: 'box' | 'sphere' | 'capsule' | 'trimesh' | 'convex';
  isTrigger?: boolean;
}

/**
 * Physics event types
 */
export type PhysicsEventType = 'collision-start' | 'collision-end' | 'trigger-enter' | 'trigger-exit';

export interface PhysicsEvent {
  type: PhysicsEventType;
  bodyA: THREE.Object3D;
  bodyB: THREE.Object3D;
  contact?: {
    point: THREE.Vector3;
    normal: THREE.Vector3;
    impulse: number;
  };
}

/**
 * Physics world manager
 */
export class PhysicsWorld {
  private rapier: RAPIER | null = null;
  private world: RapierWorld | null = null;
  private bodies: Map<THREE.Object3D, RigidBody> = new Map();
  private colliders: Map<THREE.Object3D, Collider> = new Map();
  private eventListeners: Map<PhysicsEventType, Set<(event: PhysicsEvent) => void>> = new Map();
  private gravity: THREE.Vector3;
  private initialized = false;

  constructor(gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0)) {
    this.gravity = gravity;
  }

  /**
   * Initialize the physics world (must be called before use)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import of Rapier (optional dependency)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RAPIER: any = await import('@dimforge/rapier3d' as string);
      await RAPIER.init();

      this.rapier = RAPIER;
      this.world = new RAPIER.World({ x: this.gravity.x, y: this.gravity.y, z: this.gravity.z });
      this.initialized = true;
    } catch (error) {
      console.warn('Rapier physics not available. Install @dimforge/rapier3d to enable physics.', error);
    }
  }

  /**
   * Check if physics is available
   */
  isAvailable(): boolean {
    return this.initialized && this.world !== null;
  }

  /**
   * Add a physics body to a Three.js object
   */
  addBody(object: THREE.Object3D, config: PhysicsBodyConfig): void {
    if (!this.rapier || !this.world) {
      console.warn('Physics not initialized. Call init() first.');
      return;
    }

    // Create rigid body description
    let bodyDesc;
    switch (config.type) {
      case 'static':
        bodyDesc = this.rapier.RigidBodyDesc.fixed();
        break;
      case 'kinematic':
        bodyDesc = this.rapier.RigidBodyDesc.kinematicPositionBased();
        break;
      case 'dynamic':
      default:
        bodyDesc = this.rapier.RigidBodyDesc.dynamic();
        break;
    }

    // Set position and rotation from object
    const pos = object.position;
    const quat = object.quaternion;
    bodyDesc.setTranslation(pos.x, pos.y, pos.z);
    bodyDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });

    // Set damping
    if (config.linearDamping !== undefined) {
      bodyDesc.setLinearDamping(config.linearDamping);
    }
    if (config.angularDamping !== undefined) {
      bodyDesc.setAngularDamping(config.angularDamping);
    }

    // Create the rigid body
    const rigidBody = this.world.createRigidBody(bodyDesc);
    this.bodies.set(object, rigidBody);

    // Create collider based on object geometry
    const colliderDesc = this.createColliderDesc(object, config);
    if (colliderDesc) {
      if (config.friction !== undefined) {
        colliderDesc.setFriction(config.friction);
      }
      if (config.restitution !== undefined) {
        colliderDesc.setRestitution(config.restitution);
      }
      if (config.isTrigger) {
        colliderDesc.setSensor(true);
      }

      const collider = this.world.createCollider(colliderDesc, rigidBody);
      this.colliders.set(object, collider);
    }

    // Store reference for sync
    object.userData.physicsBody = rigidBody;
  }

  /**
   * Create collider description based on object geometry
   */
  private createColliderDesc(object: THREE.Object3D, config: PhysicsBodyConfig) {
    if (!this.rapier) return null;

    // Get bounding box for sizing
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    const colliderType = config.colliderType || this.inferColliderType(object);

    switch (colliderType) {
      case 'sphere': {
        const radius = Math.max(size.x, size.y, size.z) / 2;
        return this.rapier.ColliderDesc.ball(radius);
      }
      case 'capsule': {
        const radius = Math.max(size.x, size.z) / 2;
        const halfHeight = size.y / 2 - radius;
        return this.rapier.ColliderDesc.capsule(Math.max(0, halfHeight), radius);
      }
      case 'box':
      default: {
        return this.rapier.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
      }
    }
  }

  /**
   * Infer collider type from object geometry
   */
  private inferColliderType(object: THREE.Object3D): 'box' | 'sphere' | 'capsule' {
    if (object instanceof THREE.Mesh) {
      const geo = object.geometry;
      if (geo instanceof THREE.SphereGeometry) return 'sphere';
      if (geo instanceof THREE.CapsuleGeometry) return 'capsule';
    }
    return 'box';
  }

  /**
   * Remove a physics body
   */
  removeBody(object: THREE.Object3D): void {
    if (!this.world) return;

    const body = this.bodies.get(object);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(object);
    }

    const collider = this.colliders.get(object);
    if (collider) {
      this.colliders.delete(object);
    }

    delete object.userData.physicsBody;
  }

  /**
   * Step the physics simulation
   */
  step(deltaTime?: number): void {
    if (!this.world) return;

    // Step the world
    this.world.step();

    // Sync Three.js objects with physics bodies
    this.bodies.forEach((body, object) => {
      if (body.isDynamic() || body.isKinematic()) {
        const translation = body.translation();
        const rotation = body.rotation();

        object.position.set(translation.x, translation.y, translation.z);
        object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    });
  }

  /**
   * Apply a force to a body
   */
  applyForce(object: THREE.Object3D, force: THREE.Vector3, point?: THREE.Vector3): void {
    const body = this.bodies.get(object);
    if (!body || !body.isDynamic()) return;

    if (point) {
      body.applyForceAtPoint({ x: force.x, y: force.y, z: force.z }, { x: point.x, y: point.y, z: point.z }, true);
    } else {
      body.applyForce({ x: force.x, y: force.y, z: force.z }, true);
    }
  }

  /**
   * Apply an impulse to a body
   */
  applyImpulse(object: THREE.Object3D, impulse: THREE.Vector3, point?: THREE.Vector3): void {
    const body = this.bodies.get(object);
    if (!body || !body.isDynamic()) return;

    if (point) {
      body.applyImpulseAtPoint({ x: impulse.x, y: impulse.y, z: impulse.z }, { x: point.x, y: point.y, z: point.z }, true);
    } else {
      body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
    }
  }

  /**
   * Set velocity of a body
   */
  setVelocity(object: THREE.Object3D, velocity: THREE.Vector3): void {
    const body = this.bodies.get(object);
    if (!body) return;
    body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  }

  /**
   * Get velocity of a body
   */
  getVelocity(object: THREE.Object3D): THREE.Vector3 | null {
    const body = this.bodies.get(object);
    if (!body) return null;
    const vel = body.linvel();
    return new THREE.Vector3(vel.x, vel.y, vel.z);
  }

  /**
   * Set angular velocity of a body
   */
  setAngularVelocity(object: THREE.Object3D, angularVelocity: THREE.Vector3): void {
    const body = this.bodies.get(object);
    if (!body) return;
    body.setAngvel({ x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z }, true);
  }

  /**
   * Add event listener
   */
  on(event: PhysicsEventType, callback: (event: PhysicsEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Set gravity
   */
  setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
    if (this.world) {
      this.world.gravity = { x: gravity.x, y: gravity.y, z: gravity.z };
    }
  }

  /**
   * Raycast into the physics world
   */
  raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 100
  ): { object: THREE.Object3D; point: THREE.Vector3; normal: THREE.Vector3; distance: number } | null {
    if (!this.rapier || !this.world) return null;

    const ray = new this.rapier.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: direction.x, y: direction.y, z: direction.z }
    );

    const hit = this.world.castRay(ray, maxDistance, true);
    if (!hit) return null;

    // Find the Three.js object for this collider
    let hitObject: THREE.Object3D | null = null;
    this.colliders.forEach((collider, object) => {
      if (collider === hit.collider) {
        hitObject = object;
      }
    });

    if (!hitObject) return null;

    const point = ray.pointAt(hit.timeOfImpact);
    const normal = hit.normal;

    return {
      object: hitObject,
      point: new THREE.Vector3(point.x, point.y, point.z),
      normal: new THREE.Vector3(normal.x, normal.y, normal.z),
      distance: hit.timeOfImpact,
    };
  }

  /**
   * Dispose of physics resources
   */
  dispose(): void {
    this.bodies.clear();
    this.colliders.clear();
    this.world = null;
    this.rapier = null;
    this.initialized = false;
  }
}

/**
 * Create a physics world instance
 */
export function createPhysicsWorld(gravity?: THREE.Vector3): PhysicsWorld {
  return new PhysicsWorld(gravity);
}
