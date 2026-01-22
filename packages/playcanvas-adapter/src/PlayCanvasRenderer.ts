/**
 * PlayCanvas Renderer Implementation for HoloScript
 *
 * Implements the Renderer interface from @holoscript/core
 * to bridge HoloScript nodes to PlayCanvas entities.
 */

import * as pc from 'playcanvas';

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
 * PlayCanvas implementation of the HoloScript Renderer interface
 */
export class PlayCanvasRenderer implements Renderer {
  private app: pc.Application;
  private materials: Map<string, pc.StandardMaterial> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Default material
    const defaultMat = new pc.StandardMaterial();
    defaultMat.diffuse = this.hexToColor('#00ffff');
    defaultMat.update();
    this.materials.set('default', defaultMat);

    // Emissive material
    const emissiveMat = new pc.StandardMaterial();
    emissiveMat.diffuse = this.hexToColor('#00ffff');
    emissiveMat.emissive = this.hexToColor('#00ffff');
    emissiveMat.update();
    this.materials.set('emissive', emissiveMat);
  }

  private hexToColor(hex: string): pc.Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new pc.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return new pc.Color(1, 1, 1);
  }

  /**
   * Create a PlayCanvas entity from HoloScript element type
   */
  createElement(type: string, properties: Record<string, unknown>): pc.Entity {
    const props = properties as ElementProperties;

    switch (type) {
      case 'orb':
      case 'sphere':
        return this.createPrimitive('sphere', props);

      case 'cube':
      case 'box':
        return this.createPrimitive('box', props);

      case 'cylinder':
        return this.createPrimitive('cylinder', props);

      case 'cone':
        return this.createPrimitive('cone', props);

      case 'plane':
        return this.createPrimitive('plane', props);

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
   * Update an existing PlayCanvas entity
   */
  updateElement(element: unknown, properties: Record<string, unknown>): void {
    const entity = element as pc.Entity;
    const props = properties as ElementProperties;

    // Position
    if (props.position) {
      entity.setPosition(...props.position);
    }

    // Rotation
    if (props.rotation) {
      entity.setEulerAngles(...props.rotation);
    }

    // Scale
    if (props.scale !== undefined) {
      if (typeof props.scale === 'number') {
        entity.setLocalScale(props.scale, props.scale, props.scale);
      } else {
        entity.setLocalScale(...props.scale);
      }
    }

    // Size
    if (props.size !== undefined) {
      entity.setLocalScale(props.size, props.size, props.size);
    }

    // Visibility
    if (props.visible !== undefined) {
      entity.enabled = props.visible;
    }

    // Color (for render components)
    if (props.color && entity.render) {
      const material = entity.render.meshInstances[0]?.material as pc.StandardMaterial;
      if (material) {
        material.diffuse = this.hexToColor(props.color);
        material.update();
      }
    }

    // Light properties
    if (entity.light) {
      if (props.color) {
        entity.light.color = this.hexToColor(props.color);
      }
      if (props.intensity !== undefined) {
        entity.light.intensity = props.intensity;
      }
    }
  }

  /**
   * Add a child entity to a parent
   */
  appendChild(parent: unknown, child: unknown): void {
    const parentEntity = parent as pc.Entity;
    const childEntity = child as pc.Entity;

    if (parentEntity && childEntity) {
      parentEntity.addChild(childEntity);
    }
  }

  /**
   * Remove a child entity from a parent
   */
  removeChild(parent: unknown, child: unknown): void {
    const parentEntity = parent as pc.Entity;
    const childEntity = child as pc.Entity;

    if (parentEntity && childEntity) {
      parentEntity.removeChild(childEntity);
    }
  }

  /**
   * Destroy/dispose of an entity
   */
  destroy(element: unknown): void {
    const entity = element as pc.Entity;

    if (entity) {
      entity.destroy();
    }
  }

  // ==========================================================================
  // PRIMITIVE CREATION HELPERS
  // ==========================================================================

  private createPrimitive(type: string, props: ElementProperties): pc.Entity {
    const entity = new pc.Entity(type);

    // Create material
    const material = new pc.StandardMaterial();
    material.diffuse = props.color ? this.hexToColor(props.color) : this.hexToColor('#00ffff');
    if (props.opacity !== undefined && props.opacity < 1) {
      material.opacity = props.opacity;
      material.blendType = pc.BLEND_NORMAL;
    }
    material.update();

    // Add render component
    entity.addComponent('render', {
      type: type,
      material: material,
      castShadows: props.castShadow ?? true,
      receiveShadows: props.receiveShadow ?? true,
    });

    this.app.root.addChild(entity);
    this.updateElement(entity, props);

    return entity;
  }

  private createLight(props: ElementProperties): pc.Entity {
    const entity = new pc.Entity('light');

    entity.addComponent('light', {
      type: 'point',
      color: props.color ? this.hexToColor(props.color) : new pc.Color(1, 1, 1),
      intensity: props.intensity ?? 1,
      castShadows: props.castShadow ?? true,
      range: 10,
    });

    this.app.root.addChild(entity);
    this.updateElement(entity, props);

    return entity;
  }

  private createGroup(props: ElementProperties): pc.Entity {
    const entity = new pc.Entity('group');
    this.app.root.addChild(entity);
    this.updateElement(entity, props);
    return entity;
  }

  private createAvatar(props: ElementProperties): pc.Entity {
    const group = new pc.Entity('avatar');
    this.app.root.addChild(group);

    // Body
    const bodyMaterial = new pc.StandardMaterial();
    bodyMaterial.diffuse = props.color ? this.hexToColor(props.color) : this.hexToColor('#4488ff');
    bodyMaterial.update();

    const body = new pc.Entity('body');
    body.addComponent('render', {
      type: 'capsule',
      material: bodyMaterial,
    });
    body.setLocalScale(0.6, 1.4, 0.6);
    body.setLocalPosition(0, 0.8, 0);
    group.addChild(body);

    // Head
    const headMaterial = new pc.StandardMaterial();
    headMaterial.diffuse = this.hexToColor('#ffccaa');
    headMaterial.update();

    const head = new pc.Entity('head');
    head.addComponent('render', {
      type: 'sphere',
      material: headMaterial,
    });
    head.setLocalScale(0.4, 0.4, 0.4);
    head.setLocalPosition(0, 1.6, 0);
    group.addChild(head);

    this.updateElement(group, props);
    return group;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get the underlying PlayCanvas application
   */
  getApp(): pc.Application {
    return this.app;
  }

  /**
   * Register a custom material
   */
  registerMaterial(name: string, material: pc.StandardMaterial): void {
    this.materials.set(name, material);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.materials.forEach((mat) => mat.destroy());
    this.materials.clear();
  }
}
