/**
 * Babylon.js Renderer Implementation for HoloScript
 *
 * Implements the Renderer interface from @holoscript/core
 * to bridge HoloScript nodes to Babylon.js objects.
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Vector3,
  TransformNode,
  PointLight,
  HemisphericLight,
  DirectionalLight,
  AbstractMesh,
  Node,
} from '@babylonjs/core';

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
  src?: string;
  [key: string]: unknown;
}

/**
 * Babylon.js implementation of the HoloScript Renderer interface
 */
export class BabylonRenderer implements Renderer {
  private scene: Scene;
  private materials: Map<string, StandardMaterial> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Default material
    const defaultMat = new StandardMaterial('default', this.scene);
    defaultMat.diffuseColor = Color3.FromHexString('#00ffff');
    defaultMat.specularColor = new Color3(0.5, 0.5, 0.5);
    this.materials.set('default', defaultMat);

    // Emissive material
    const emissiveMat = new StandardMaterial('emissive', this.scene);
    emissiveMat.diffuseColor = Color3.FromHexString('#00ffff');
    emissiveMat.emissiveColor = Color3.FromHexString('#00ffff');
    this.materials.set('emissive', emissiveMat);
  }

  /**
   * Create a Babylon.js object from HoloScript element type
   */
  createElement(type: string, properties: Record<string, unknown>): Node {
    const props = properties as ElementProperties;

    switch (type) {
      case 'orb':
      case 'sphere':
        return this.createSphere(props);

      case 'cube':
      case 'box':
        return this.createBox(props);

      case 'cylinder':
        return this.createCylinder(props);

      case 'cone':
        return this.createCone(props);

      case 'plane':
        return this.createPlane(props);

      case 'light':
        return this.createLight(props);

      case 'group':
      case 'scene':
        return this.createGroup(props);

      case 'avatar':
        return this.createAvatar(props);

      default:
        console.warn(`Unknown element type: ${type}`);
        return this.createGroup(props);
    }
  }

  /**
   * Update an existing Babylon.js object
   */
  updateElement(element: unknown, properties: Record<string, unknown>): void {
    const node = element as Node;
    const props = properties as ElementProperties;

    // Position
    if (props.position && 'position' in node) {
      (node as TransformNode).position = new Vector3(...props.position);
    }

    // Rotation (convert degrees to radians)
    if (props.rotation && 'rotation' in node) {
      const rad = props.rotation.map((d) => (d * Math.PI) / 180);
      (node as TransformNode).rotation = new Vector3(...rad as [number, number, number]);
    }

    // Scale
    if (props.scale !== undefined && 'scaling' in node) {
      if (typeof props.scale === 'number') {
        (node as TransformNode).scaling = new Vector3(props.scale, props.scale, props.scale);
      } else {
        (node as TransformNode).scaling = new Vector3(...props.scale);
      }
    }

    // Size (uniform scale)
    if (props.size !== undefined && 'scaling' in node) {
      (node as TransformNode).scaling = new Vector3(props.size, props.size, props.size);
    }

    // Visibility
    if (props.visible !== undefined && node instanceof AbstractMesh) {
      node.isVisible = props.visible;
    }

    // Material properties (for meshes)
    if (node instanceof Mesh && node.material instanceof StandardMaterial) {
      if (props.color) {
        node.material.diffuseColor = Color3.FromHexString(props.color);
      }
      if (props.opacity !== undefined) {
        node.material.alpha = props.opacity;
      }
    }

    // Light properties
    if (node instanceof PointLight || node instanceof DirectionalLight) {
      if (props.color) {
        node.diffuse = Color3.FromHexString(props.color);
      }
      if (props.intensity !== undefined) {
        node.intensity = props.intensity;
      }
    }
  }

  /**
   * Add a child object to a parent
   */
  appendChild(parent: unknown, child: unknown): void {
    const parentNode = parent as TransformNode;
    const childNode = child as TransformNode;

    if (parentNode && childNode && 'parent' in childNode) {
      childNode.parent = parentNode;
    }
  }

  /**
   * Remove a child object from a parent
   */
  removeChild(parent: unknown, child: unknown): void {
    const childNode = child as TransformNode;

    if (childNode && 'parent' in childNode) {
      childNode.parent = null;
    }
  }

  /**
   * Destroy/dispose of an object
   */
  destroy(element: unknown): void {
    const node = element as Node;

    if (node && 'dispose' in node) {
      node.dispose();
    }
  }

  // ==========================================================================
  // PRIMITIVE CREATION HELPERS
  // ==========================================================================

  private createSphere(props: ElementProperties): Mesh {
    const mesh = MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene);
    this.applyMaterial(mesh, props);
    this.updateElement(mesh, props);
    return mesh;
  }

  private createBox(props: ElementProperties): Mesh {
    const mesh = MeshBuilder.CreateBox('box', { size: 1 }, this.scene);
    this.applyMaterial(mesh, props);
    this.updateElement(mesh, props);
    return mesh;
  }

  private createCylinder(props: ElementProperties): Mesh {
    const mesh = MeshBuilder.CreateCylinder('cylinder', { height: 1, diameter: 1 }, this.scene);
    this.applyMaterial(mesh, props);
    this.updateElement(mesh, props);
    return mesh;
  }

  private createCone(props: ElementProperties): Mesh {
    const mesh = MeshBuilder.CreateCylinder('cone', { height: 1, diameterTop: 0, diameterBottom: 1 }, this.scene);
    this.applyMaterial(mesh, props);
    this.updateElement(mesh, props);
    return mesh;
  }

  private createPlane(props: ElementProperties): Mesh {
    const mesh = MeshBuilder.CreatePlane('plane', { size: 1 }, this.scene);
    this.applyMaterial(mesh, props);
    this.updateElement(mesh, props);
    return mesh;
  }

  private createLight(props: ElementProperties): PointLight {
    const light = new PointLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = props.intensity ?? 1;
    if (props.color) {
      light.diffuse = Color3.FromHexString(props.color);
    }
    this.updateElement(light, props);
    return light;
  }

  private createGroup(props: ElementProperties): TransformNode {
    const group = new TransformNode('group', this.scene);
    this.updateElement(group, props);
    return group;
  }

  private createAvatar(props: ElementProperties): TransformNode {
    const group = new TransformNode('avatar', this.scene);

    // Create simple avatar placeholder
    const body = MeshBuilder.CreateCapsule('body', { height: 1.4, radius: 0.3 }, this.scene);
    body.position.y = 0.8;
    body.parent = group;
    this.applyMaterial(body, { color: props.color || '#4488ff' });

    const head = MeshBuilder.CreateSphere('head', { diameter: 0.4 }, this.scene);
    head.position.y = 1.6;
    head.parent = group;
    this.applyMaterial(head, { color: '#ffccaa' });

    this.updateElement(group, props);
    return group;
  }

  private applyMaterial(mesh: Mesh, props: ElementProperties): void {
    const mat = new StandardMaterial(`mat_${mesh.name}`, this.scene);
    mat.diffuseColor = props.color ? Color3.FromHexString(props.color) : Color3.FromHexString('#00ffff');
    mat.specularColor = new Color3(0.3, 0.3, 0.3);

    if (props.opacity !== undefined && props.opacity < 1) {
      mat.alpha = props.opacity;
    }

    mesh.material = mat;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get the underlying Babylon.js scene
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Register a custom material
   */
  registerMaterial(name: string, material: StandardMaterial): void {
    this.materials.set(name, material);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.materials.forEach((mat) => mat.dispose());
    this.materials.clear();
  }
}
