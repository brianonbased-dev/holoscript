/**
 * HoloScript World - Complete 3D Scene Management
 *
 * Provides a ready-to-use 3D world that integrates:
 * - Three.js scene, camera, renderer
 * - HoloScript runtime execution
 * - VR/XR session management
 * - Animation loop
 * - .hsplus file loading
 */

import * as THREE from 'three';
import { ThreeRenderer } from './ThreeRenderer';
import { HoloScriptPlusParser, createRuntime } from '@holoscript/core';

/**
 * World configuration options
 */
export interface WorldOptions {
  /** Canvas element or container */
  container: HTMLElement;
  /** Enable VR/XR support */
  xrEnabled?: boolean;
  /** Enable shadows */
  shadows?: boolean;
  /** Background color */
  backgroundColor?: number | string;
  /** Antialiasing */
  antialias?: boolean;
  /** Pixel ratio (default: device pixel ratio) */
  pixelRatio?: number;
  /** Initial camera position */
  cameraPosition?: [number, number, number];
}

/**
 * HoloScript World - Manages the complete 3D environment
 */
export class World {
  // Three.js core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // HoloScript integration
  private threeRenderer: ThreeRenderer;
  private holoRuntime: ReturnType<typeof createRuntime> | null = null;
  private parser: HoloScriptPlusParser;

  // Animation
  private animationId: number | null = null;
  private updateCallbacks: Set<(delta: number) => void> = new Set();

  // XR
  private xrEnabled: boolean;

  // Container
  private container: HTMLElement;

  constructor(options: WorldOptions) {
    this.container = options.container;
    this.xrEnabled = options.xrEnabled ?? false;

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    if (options.backgroundColor) {
      this.scene.background = new THREE.Color(options.backgroundColor);
    }

    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(...(options.cameraPosition ?? [0, 1.6, 5]));

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: true,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(options.pixelRatio ?? window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Shadows
    if (options.shadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // XR support
    if (this.xrEnabled) {
      this.renderer.xr.enabled = true;
    }

    // Append to container
    this.container.appendChild(this.renderer.domElement);

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Create HoloScript renderer bridge
    this.threeRenderer = new ThreeRenderer(this.scene);

    // Parser
    this.parser = new HoloScriptPlusParser({ enableVRTraits: true });

    // Setup default lighting
    this.setupDefaultLighting();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Setup default scene lighting
   */
  private setupDefaultLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    this.scene.add(directional);

    // Hemisphere light for natural ambient
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.3);
    this.scene.add(hemisphere);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Load and execute a .hsplus file from URL
   */
  async loadFile(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    const source = await response.text();
    this.loadSource(source);
  }

  /**
   * Load multiple .hsplus files
   */
  async loadFiles(urls: string[]): Promise<void> {
    const sources = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        return response.text();
      })
    );
    // Combine all sources
    const combinedSource = sources.join('\n\n');
    this.loadSource(combinedSource);
  }

  /**
   * Load and execute HoloScript source code
   */
  loadSource(source: string): void {
    // Parse the source
    const result = this.parser.parse(source);

    if (!result.success) {
      console.error('HoloScript parse errors:', result.errors);
      return;
    }

    // Unmount previous runtime
    if (this.holoRuntime) {
      this.holoRuntime.unmount();
    }

    // Create new runtime with Three.js renderer
    this.holoRuntime = createRuntime(result.ast, {
      renderer: this.threeRenderer,
      vrEnabled: this.xrEnabled,
    });

    // Mount to scene
    this.holoRuntime.mount(this.scene);
  }

  /**
   * Load from parsed AST
   */
  loadAST(ast: unknown): void {
    if (this.holoRuntime) {
      this.holoRuntime.unmount();
    }

    this.holoRuntime = createRuntime(ast as any, {
      renderer: this.threeRenderer,
      vrEnabled: this.xrEnabled,
    });

    this.holoRuntime.mount(this.scene);
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.animationId !== null) return;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();

      // Run update callbacks
      for (const callback of this.updateCallbacks) {
        callback(delta);
      }

      // Update HoloScript runtime
      if (this.holoRuntime) {
        (this.holoRuntime as any).update?.(delta);
      }

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    this.clock.start();
    animate();
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }

  /**
   * Add an update callback
   */
  onUpdate(callback: (delta: number) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the WebGL renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the HoloScript runtime
   */
  getRuntime(): ReturnType<typeof createRuntime> | null {
    return this.holoRuntime;
  }

  /**
   * Get the Three.js adapter renderer
   */
  getThreeRenderer(): ThreeRenderer {
    return this.threeRenderer;
  }

  /**
   * Subscribe to HoloScript runtime events
   */
  on(event: string, handler: (payload: unknown) => void): () => void {
    if (!this.holoRuntime) {
      console.warn('No runtime loaded. Event handler not registered.');
      return () => {};
    }
    return this.holoRuntime.on(event, handler);
  }

  /**
   * Emit an event to the HoloScript runtime
   */
  emit(event: string, payload?: unknown): void {
    if (this.holoRuntime) {
      this.holoRuntime.emit(event, payload);
    }
  }

  /**
   * Update runtime state
   */
  setState(updates: Record<string, unknown>): void {
    if (this.holoRuntime) {
      this.holoRuntime.setState(updates);
    }
  }

  /**
   * Get runtime state
   */
  getState(): Record<string, unknown> {
    if (this.holoRuntime) {
      return this.holoRuntime.getState();
    }
    return {};
  }

  /**
   * Enable VR/XR session
   */
  async enterXR(mode: 'immersive-vr' | 'immersive-ar' = 'immersive-vr'): Promise<void> {
    if (!this.xrEnabled) {
      console.warn('XR not enabled. Pass xrEnabled: true to World constructor.');
      return;
    }

    const session = await navigator.xr?.requestSession(mode);
    if (session) {
      await this.renderer.xr.setSession(session);
    }
  }

  /**
   * Clean up and dispose resources
   */
  dispose(): void {
    this.stop();

    // Unmount runtime
    if (this.holoRuntime) {
      this.holoRuntime.unmount();
      this.holoRuntime = null;
    }

    // Remove resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Dispose Three.js resources
    this.renderer.dispose();

    // Remove canvas
    this.container.removeChild(this.renderer.domElement);
  }
}

/**
 * Create a new HoloScript World
 */
export function createWorld(options: WorldOptions): World {
  return new World(options);
}
