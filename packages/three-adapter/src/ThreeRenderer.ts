/**
 * Three.js Renderer Implementation for HoloScript
 *
 * Implements the Renderer interface from @holoscript/core
 * to bridge HoloScript nodes to Three.js objects.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Renderer interface from HoloScriptPlusRuntime
 */
export interface Renderer {
  createElement(type: string, properties: Record<string, unknown>): unknown;
  updateElement(element: unknown, properties: Record<string, unknown>): void;
  appendChild(parent: unknown, child: unknown): void;
  removeChild(parent: unknown, child: unknown): void;
  destroy(element: unknown): void;
}

/**
 * Properties for HoloScript elements
 */
interface ElementProperties {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  color?: string;
  size?: number;
  opacity?: number;
  visible?: boolean;
  material?: string;
  intensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  // Model properties
  src?: string;
  animations?: boolean;
  // Audio properties
  audio?: string;
  volume?: number;
  loop?: boolean;
  spatial?: boolean;
  // Physics properties
  physics?: 'static' | 'dynamic' | 'kinematic';
  mass?: number;
  friction?: number;
  restitution?: number;
  [key: string]: unknown;
}

/**
 * Three.js implementation of the HoloScript Renderer interface
 */
export class ThreeRenderer implements Renderer {
  private scene: THREE.Scene;
  private materials: Map<string, THREE.Material> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  private modelCache: Map<string, GLTF> = new Map();
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private audioLoader: THREE.AudioLoader;
  private audioListener: THREE.AudioListener | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Initialize GLTF loader with Draco compression support
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Initialize audio loader
    this.audioLoader = new THREE.AudioLoader();

    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Default materials
    this.materials.set('default', new THREE.MeshStandardMaterial({ color: 0x00ffff }));
    this.materials.set('emissive', new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    }));

    // Default geometries (cached for performance)
    this.geometries.set('sphere', new THREE.SphereGeometry(0.5, 32, 32));
    this.geometries.set('cube', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('box', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('cylinder', new THREE.CylinderGeometry(0.5, 0.5, 1, 32));
    this.geometries.set('cone', new THREE.ConeGeometry(0.5, 1, 32));
    this.geometries.set('plane', new THREE.PlaneGeometry(1, 1));
  }

  /**
   * Create a Three.js object from HoloScript element type
   */
  createElement(type: string, properties: Record<string, unknown>): THREE.Object3D {
    const props = properties as ElementProperties;

    switch (type) {
      case 'orb':
      case 'sphere':
        return this.createMesh('sphere', props);

      case 'cube':
      case 'box':
        return this.createMesh('cube', props);

      case 'cylinder':
        return this.createMesh('cylinder', props);

      case 'cone':
        return this.createMesh('cone', props);

      case 'plane':
        return this.createMesh('plane', props);

      case 'light':
        return this.createLight(props);

      case 'group':
      case 'scene':
        return this.createGroup(props);

      case 'camera':
        return this.createCamera(props);

      case 'text':
        return this.createText(props);

      case 'avatar':
        return this.createAvatar(props);

      case 'model':
      case 'gltf':
        return this.createModelPlaceholder(props);

      case 'audio':
      case 'sound':
        return this.createAudioSource(props);

      default:
        // Unknown type - create empty group
        console.warn(`Unknown element type: ${type}`);
        return this.createGroup(props);
    }
  }

  /**
   * Load a GLTF/GLB model asynchronously
   * Returns a promise that resolves when the model is loaded
   */
  async loadModel(src: string, options?: { animations?: boolean }): Promise<THREE.Group> {
    // Check cache first
    if (this.modelCache.has(src)) {
      const cached = this.modelCache.get(src)!;
      return cached.scene.clone();
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        src,
        (gltf) => {
          // Cache the loaded model
          this.modelCache.set(src, gltf);

          // Clone for this instance
          const model = gltf.scene.clone();

          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`Failed to load model: ${src}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Get animations from a loaded model
   */
  getModelAnimations(src: string): THREE.AnimationClip[] {
    const cached = this.modelCache.get(src);
    return cached?.animations ?? [];
  }

  /**
   * Update an existing Three.js object
   */
  updateElement(element: unknown, properties: Record<string, unknown>): void {
    const obj = element as THREE.Object3D;
    const props = properties as ElementProperties;

    // Position
    if (props.position) {
      obj.position.set(...props.position);
    }

    // Rotation (convert degrees to radians)
    if (props.rotation) {
      obj.rotation.set(
        THREE.MathUtils.degToRad(props.rotation[0]),
        THREE.MathUtils.degToRad(props.rotation[1]),
        THREE.MathUtils.degToRad(props.rotation[2])
      );
    }

    // Scale
    if (props.scale !== undefined) {
      if (typeof props.scale === 'number') {
        obj.scale.setScalar(props.scale);
      } else {
        obj.scale.set(...props.scale);
      }
    }

    // Size (for meshes)
    if (props.size !== undefined && obj instanceof THREE.Mesh) {
      obj.scale.setScalar(props.size);
    }

    // Visibility
    if (props.visible !== undefined) {
      obj.visible = props.visible;
    }

    // Material properties (for meshes)
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      if (props.color) {
        obj.material.color.set(props.color);
      }
      if (props.opacity !== undefined) {
        obj.material.opacity = props.opacity;
        obj.material.transparent = props.opacity < 1;
      }
    }

    // Light properties
    if (obj instanceof THREE.Light) {
      if (props.color) {
        obj.color.set(props.color);
      }
      if (props.intensity !== undefined) {
        obj.intensity = props.intensity;
      }
    }

    // Shadow properties
    if (props.castShadow !== undefined) {
      obj.castShadow = props.castShadow;
    }
    if (props.receiveShadow !== undefined) {
      obj.receiveShadow = props.receiveShadow;
    }
  }

  /**
   * Add a child object to a parent
   */
  appendChild(parent: unknown, child: unknown): void {
    const parentObj = parent as THREE.Object3D;
    const childObj = child as THREE.Object3D;

    if (parentObj && childObj) {
      parentObj.add(childObj);
    }
  }

  /**
   * Remove a child object from a parent
   */
  removeChild(parent: unknown, child: unknown): void {
    const parentObj = parent as THREE.Object3D;
    const childObj = child as THREE.Object3D;

    if (parentObj && childObj) {
      parentObj.remove(childObj);
    }
  }

  /**
   * Destroy/dispose of an object
   */
  destroy(element: unknown): void {
    const obj = element as THREE.Object3D;

    if (obj instanceof THREE.Mesh) {
      // Don't dispose cached geometries
      if (!Array.from(this.geometries.values()).includes(obj.geometry)) {
        obj.geometry.dispose();
      }
      // Don't dispose cached materials
      if (obj.material instanceof THREE.Material) {
        if (!Array.from(this.materials.values()).includes(obj.material)) {
          obj.material.dispose();
        }
      }
    }

    // Remove from parent
    if (obj.parent) {
      obj.parent.remove(obj);
    }
  }

  // ==========================================================================
  // PRIMITIVE CREATION HELPERS
  // ==========================================================================

  private createMesh(geometryType: string, props: ElementProperties): THREE.Mesh {
    const geometry = this.geometries.get(geometryType) || this.geometries.get('sphere')!;

    // Create material based on properties
    const material = new THREE.MeshStandardMaterial({
      color: props.color ? new THREE.Color(props.color) : 0x00ffff,
      opacity: props.opacity ?? 1,
      transparent: (props.opacity ?? 1) < 1,
    });

    const mesh = new THREE.Mesh(geometry.clone(), material);

    // Apply initial properties
    this.updateElement(mesh, props);

    // Enable shadows by default
    mesh.castShadow = props.castShadow ?? true;
    mesh.receiveShadow = props.receiveShadow ?? true;

    return mesh;
  }

  private createLight(props: ElementProperties): THREE.Light {
    // Default to point light
    const light = new THREE.PointLight(
      props.color ? new THREE.Color(props.color) : 0xffffff,
      props.intensity ?? 1
    );

    light.castShadow = props.castShadow ?? true;

    this.updateElement(light, props);

    return light;
  }

  private createGroup(props: ElementProperties): THREE.Group {
    const group = new THREE.Group();
    this.updateElement(group, props);
    return group;
  }

  private createCamera(props: ElementProperties): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.updateElement(camera, props);
    return camera;
  }

  private createText(props: ElementProperties): THREE.Object3D {
    // Text requires additional setup (font loading)
    // For now, create a placeholder group
    const group = new THREE.Group();
    group.name = 'text';
    this.updateElement(group, props);
    return group;
  }

  private createAvatar(props: ElementProperties): THREE.Group {
    // Avatar placeholder - would need GLTF loader for actual models
    const group = new THREE.Group();
    group.name = 'avatar';

    // Create simple placeholder geometry
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1, 4, 8),
      new THREE.MeshStandardMaterial({ color: props.color || 0x4488ff })
    );
    body.position.y = 0.8;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: props.color || 0xffccaa })
    );
    head.position.y = 1.6;

    group.add(body, head);
    this.updateElement(group, props);

    return group;
  }

  private createModelPlaceholder(props: ElementProperties): THREE.Group {
    // Create a group that will hold the model once loaded
    const group = new THREE.Group();
    group.name = 'model';
    group.userData.modelSrc = props.src;
    group.userData.isModelPlaceholder = true;

    // Apply transforms
    this.updateElement(group, props);

    // If src is provided, start loading asynchronously
    if (props.src) {
      this.loadModel(props.src, { animations: props.animations })
        .then((model) => {
          // Add loaded model to group
          group.add(model);
          group.userData.isModelPlaceholder = false;
          group.userData.loadedModel = model;
        })
        .catch((err) => {
          console.error(`Failed to load model ${props.src}:`, err);
        });
    }

    return group;
  }

  private createAudioSource(props: ElementProperties): THREE.Group {
    const group = new THREE.Group();
    group.name = 'audio';
    group.userData.audioSrc = props.audio;

    // Apply transforms
    this.updateElement(group, props);

    // Create audio source if we have a listener
    if (props.audio && this.audioListener) {
      const isSpatial = props.spatial !== false;

      if (isSpatial) {
        // Positional (3D) audio
        const sound = new THREE.PositionalAudio(this.audioListener);
        sound.setRefDistance(1);
        sound.setRolloffFactor(1);
        sound.setDistanceModel('inverse');

        this.audioLoader.load(props.audio, (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(props.loop ?? false);
          sound.setVolume(props.volume ?? 1);
          group.userData.audio = sound;
        });

        group.add(sound);
      } else {
        // Non-spatial (global) audio
        const sound = new THREE.Audio(this.audioListener);

        this.audioLoader.load(props.audio, (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(props.loop ?? false);
          sound.setVolume(props.volume ?? 1);
          group.userData.audio = sound;
        });

        group.add(sound);
      }
    }

    return group;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get the underlying Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Register a custom material
   */
  registerMaterial(name: string, material: THREE.Material): void {
    this.materials.set(name, material);
  }

  /**
   * Register a custom geometry
   */
  registerGeometry(name: string, geometry: THREE.BufferGeometry): void {
    this.geometries.set(name, geometry);
  }

  /**
   * Set the audio listener (usually attached to camera)
   */
  setAudioListener(listener: THREE.AudioListener): void {
    this.audioListener = listener;
  }

  /**
   * Get the audio listener
   */
  getAudioListener(): THREE.AudioListener | null {
    return this.audioListener;
  }

  /**
   * Preload a model into cache
   */
  async preloadModel(src: string): Promise<void> {
    if (!this.modelCache.has(src)) {
      await this.loadModel(src);
    }
  }

  /**
   * Clear the model cache
   */
  clearModelCache(): void {
    this.modelCache.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Dispose geometries
    this.geometries.forEach((geo) => geo.dispose());
    this.geometries.clear();

    // Dispose materials
    this.materials.forEach((mat) => mat.dispose());
    this.materials.clear();

    // Clear model cache
    this.modelCache.clear();

    // Dispose draco loader
    this.dracoLoader.dispose();
  }
}
