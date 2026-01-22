/**
 * HoloScript World - Complete 3D Scene Management for Babylon.js
 *
 * Provides a ready-to-use 3D world that integrates:
 * - Babylon.js scene, camera, engine
 * - HoloScript runtime execution
 * - VR/XR session management
 * - Animation loop
 * - .hsplus file loading
 */

import {
  Engine,
  Scene,
  FreeCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  WebXRDefaultExperience,
} from '@babylonjs/core';
import { BabylonRenderer } from './BabylonRenderer';
import { HoloScriptPlusParser, createRuntime } from '@holoscript/core';

/**
 * World configuration options
 */
export interface WorldOptions {
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Enable VR/XR support */
  xrEnabled?: boolean;
  /** Enable shadows */
  shadows?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Antialiasing */
  antialias?: boolean;
  /** Initial camera position */
  cameraPosition?: [number, number, number];
  /** Base URL for loading .hsplus files */
  basePath?: string;
}

/**
 * Config loaded from holoscript.config.hsplus
 */
export interface HoloScriptConfig {
  world?: Partial<Omit<WorldOptions, 'canvas'>>;
  files?: string[];
  assets?: string;
  autoStart?: boolean;
}

/**
 * @world trait configuration
 */
export interface WorldTraitConfig {
  backgroundColor?: string;
  xr?: boolean;
  shadows?: boolean;
  camera?: { position: [number, number, number]; fov?: number };
  ambient?: number;
  lighting?: 'default' | 'none' | 'studio' | 'outdoor';
}

/**
 * HoloScript World - Manages the complete 3D environment with Babylon.js
 */
export class World {
  private engine: Engine;
  private scene: Scene;
  private camera: FreeCamera;
  private babylonRenderer: BabylonRenderer;
  private holoRuntime: ReturnType<typeof createRuntime> | null = null;
  private parser: HoloScriptPlusParser;
  private xrExperience: WebXRDefaultExperience | null = null;
  private xrEnabled: boolean;
  private basePath: string;
  private canvas: HTMLCanvasElement;

  constructor(options: WorldOptions) {
    this.canvas = options.canvas;
    this.xrEnabled = options.xrEnabled ?? false;
    this.basePath = options.basePath ?? '';

    // Initialize Babylon.js engine
    this.engine = new Engine(this.canvas, options.antialias ?? true);

    // Create scene
    this.scene = new Scene(this.engine);
    if (options.backgroundColor) {
      this.scene.clearColor = Color4.FromHexString(options.backgroundColor + 'ff');
    }

    // Camera
    this.camera = new FreeCamera('camera', new Vector3(...(options.cameraPosition ?? [0, 1.6, 5])), this.scene);
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.canvas, true);

    // Create HoloScript renderer bridge
    this.babylonRenderer = new BabylonRenderer(this.scene);

    // Parser
    this.parser = new HoloScriptPlusParser({ enableVRTraits: true });

    // Setup default lighting
    this.setupDefaultLighting();

    // Handle resize
    window.addEventListener('resize', () => this.engine.resize());
  }

  private setupDefaultLighting(): void {
    // Ambient light
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.4;

    // Directional light (sun)
    const directional = new DirectionalLight('sun', new Vector3(-1, -2, -1), this.scene);
    directional.intensity = 0.8;
    directional.position = new Vector3(5, 10, 5);
  }

  /**
   * Load a .hsplus file from URL
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
    this.loadSource(sources.join('\n\n'));
  }

  /**
   * Load and execute HoloScript source code
   */
  loadSource(source: string): void {
    // Extract @world trait if present
    const worldTrait = this.extractWorldTrait(source);
    if (worldTrait) {
      this.applyWorldTrait(worldTrait);
      source = this.stripWorldTrait(source);
    }

    const result = this.parser.parse(source);

    if (!result.success) {
      console.error('HoloScript parse errors:', result.errors);
      return;
    }

    if (this.holoRuntime) {
      this.holoRuntime.unmount();
    }

    this.holoRuntime = createRuntime(result.ast, {
      renderer: this.babylonRenderer,
      vrEnabled: this.xrEnabled,
    });

    this.holoRuntime.mount(this.scene);
  }

  /**
   * Auto-load index.hsplus from a directory
   */
  async loadDirectory(path: string): Promise<void> {
    const basePath = path.endsWith('/') ? path : `${path}/`;
    await this.loadFile(`${basePath}index.hsplus`);
  }

  /**
   * Load config manifest
   */
  async loadConfig(configPath?: string): Promise<HoloScriptConfig> {
    const path = configPath ?? `${this.basePath}holoscript.config.hsplus`;
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const source = await response.text();
    const config = this.parseConfigFile(source);

    if (config.world?.backgroundColor) {
      this.scene.clearColor = Color4.FromHexString(config.world.backgroundColor + 'ff');
    }

    if (config.files && config.files.length > 0) {
      const baseDir = path.substring(0, path.lastIndexOf('/') + 1) || this.basePath;
      const fullPaths = config.files.map((f) =>
        f.startsWith('/') || f.startsWith('http') ? f : `${baseDir}${f}`
      );
      await this.loadFiles(fullPaths);
    }

    if (config.autoStart) {
      this.start();
    }

    return config;
  }

  private parseConfigFile(source: string): HoloScriptConfig {
    const config: HoloScriptConfig = {};

    const configMatch = source.match(/@config\s*\{([\s\S]*?)\n\}/);
    if (!configMatch) return config;

    const content = configMatch[1];

    const filesMatch = content.match(/files\s*:\s*\[([\s\S]*?)\]/);
    if (filesMatch) {
      config.files = filesMatch[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//'))
        .map((l) => l.match(/["']([^"']+)["']/)?.[1])
        .filter(Boolean) as string[];
    }

    const autoStartMatch = content.match(/autoStart\s*:\s*(true|false)/);
    if (autoStartMatch) {
      config.autoStart = autoStartMatch[1] === 'true';
    }

    return config;
  }

  private extractWorldTrait(source: string): WorldTraitConfig | null {
    const match = source.match(/@world\s*\{([\s\S]*?)\n\}/);
    if (!match) return null;

    const content = match[1];
    const config: WorldTraitConfig = {};

    const bgMatch = content.match(/backgroundColor\s*:\s*["']([^"']+)["']/);
    if (bgMatch) config.backgroundColor = bgMatch[1];

    const lightingMatch = content.match(/lighting\s*:\s*["'](\w+)["']/);
    if (lightingMatch) config.lighting = lightingMatch[1] as WorldTraitConfig['lighting'];

    return config;
  }

  private applyWorldTrait(config: WorldTraitConfig): void {
    if (config.backgroundColor) {
      this.scene.clearColor = Color4.FromHexString(config.backgroundColor + 'ff');
    }

    if (config.lighting) {
      this.applyLightingPreset(config.lighting);
    }
  }

  private applyLightingPreset(preset: string): void {
    // Remove existing lights
    this.scene.lights.forEach((light) => light.dispose());

    switch (preset) {
      case 'none':
        break;

      case 'studio': {
        const key = new DirectionalLight('key', new Vector3(-1, -1, 1), this.scene);
        key.intensity = 1.0;

        const fill = new DirectionalLight('fill', new Vector3(1, -0.5, 0), this.scene);
        fill.intensity = 0.4;

        const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.2;
        break;
      }

      case 'outdoor': {
        const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), this.scene);
        sun.intensity = 1.2;

        const sky = new HemisphericLight('sky', new Vector3(0, 1, 0), this.scene);
        sky.intensity = 0.6;
        sky.groundColor = Color3.FromHexString('#3c5f2e');
        sky.diffuse = Color3.FromHexString('#87ceeb');
        break;
      }

      default:
        this.setupDefaultLighting();
    }
  }

  private stripWorldTrait(source: string): string {
    return source.replace(/@world\s*\{[\s\S]*?\n\}/, '').trim();
  }

  /**
   * Start the render loop
   */
  start(): void {
    this.engine.runRenderLoop(() => {
      if (this.holoRuntime) {
        (this.holoRuntime as any).update?.(this.engine.getDeltaTime() / 1000);
      }
      this.scene.render();
    });
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    this.engine.stopRenderLoop();
  }

  /**
   * Enable VR/XR session
   */
  async enterXR(): Promise<void> {
    if (!this.xrEnabled) {
      console.warn('XR not enabled. Pass xrEnabled: true to World constructor.');
      return;
    }

    try {
      this.xrExperience = await this.scene.createDefaultXRExperienceAsync({
        uiOptions: { sessionMode: 'immersive-vr' },
      });
    } catch (error) {
      console.error('Failed to enter XR:', error);
    }
  }

  /**
   * Get the Babylon.js scene
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): FreeCamera {
    return this.camera;
  }

  /**
   * Get the engine
   */
  getEngine(): Engine {
    return this.engine;
  }

  /**
   * Get the HoloScript runtime
   */
  getRuntime(): ReturnType<typeof createRuntime> | null {
    return this.holoRuntime;
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (payload: unknown) => void): () => void {
    if (!this.holoRuntime) return () => {};
    return this.holoRuntime.on(event, handler);
  }

  /**
   * Emit an event
   */
  emit(event: string, payload?: unknown): void {
    this.holoRuntime?.emit(event, payload);
  }

  /**
   * Set runtime state
   */
  setState(updates: Record<string, unknown>): void {
    this.holoRuntime?.setState(updates);
  }

  /**
   * Get runtime state
   */
  getState(): Record<string, unknown> {
    return this.holoRuntime?.getState() ?? {};
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stop();

    if (this.holoRuntime) {
      this.holoRuntime.unmount();
      this.holoRuntime = null;
    }

    this.babylonRenderer.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}

/**
 * Create a new HoloScript World with Babylon.js
 */
export function createWorld(options: WorldOptions): World {
  return new World(options);
}
