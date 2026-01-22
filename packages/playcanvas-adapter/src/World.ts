/**
 * HoloScript World - Complete 3D Scene Management for PlayCanvas
 *
 * Provides a ready-to-use 3D world that integrates:
 * - PlayCanvas application, scene, camera
 * - HoloScript runtime execution
 * - VR/XR session management
 * - Animation loop
 * - .hsplus file loading
 */

import * as pc from 'playcanvas';
import { PlayCanvasRenderer } from './PlayCanvasRenderer';
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
  lighting?: 'default' | 'none' | 'studio' | 'outdoor';
}

/**
 * HoloScript World - Manages the complete 3D environment with PlayCanvas
 */
export class World {
  private app: pc.Application;
  private camera: pc.Entity;
  private playcanvasRenderer: PlayCanvasRenderer;
  private holoRuntime: ReturnType<typeof createRuntime> | null = null;
  private parser: HoloScriptPlusParser;
  private xrEnabled: boolean;
  private basePath: string;

  constructor(options: WorldOptions) {
    this.xrEnabled = options.xrEnabled ?? false;
    this.basePath = options.basePath ?? '';

    // Initialize PlayCanvas application
    this.app = new pc.Application(options.canvas, {
      mouse: new pc.Mouse(options.canvas),
      touch: new pc.TouchDevice(options.canvas),
      keyboard: new pc.Keyboard(window),
    });

    // Set resolution
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Background color
    if (options.backgroundColor) {
      this.app.scene.ambientLight = this.hexToColor(options.backgroundColor);
    }

    // Camera
    this.camera = new pc.Entity('camera');
    this.camera.addComponent('camera', {
      clearColor: options.backgroundColor
        ? this.hexToColor(options.backgroundColor)
        : new pc.Color(0.1, 0.1, 0.15, 1),
    });
    this.camera.setPosition(...(options.cameraPosition ?? [0, 1.6, 5]));
    this.app.root.addChild(this.camera);

    // Create HoloScript renderer bridge
    this.playcanvasRenderer = new PlayCanvasRenderer(this.app);

    // Parser
    this.parser = new HoloScriptPlusParser({ enableVRTraits: true });

    // Setup default lighting
    this.setupDefaultLighting();

    // Handle resize
    window.addEventListener('resize', () => this.app.resizeCanvas());
  }

  private hexToColor(hex: string): pc.Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new pc.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1
      );
    }
    return new pc.Color(1, 1, 1, 1);
  }

  private setupDefaultLighting(): void {
    // Ambient light
    this.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

    // Directional light (sun)
    const directional = new pc.Entity('sun');
    directional.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 1, 1),
      intensity: 0.8,
      castShadows: true,
      shadowBias: 0.2,
      shadowResolution: 2048,
    });
    directional.setEulerAngles(45, 30, 0);
    this.app.root.addChild(directional);
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
    // Extract @world trait
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
      renderer: this.playcanvasRenderer,
      vrEnabled: this.xrEnabled,
    });

    this.holoRuntime.mount(this.app.root);
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
      this.camera.camera!.clearColor = this.hexToColor(config.world.backgroundColor);
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
      this.camera.camera!.clearColor = this.hexToColor(config.backgroundColor);
    }

    if (config.lighting) {
      this.applyLightingPreset(config.lighting);
    }
  }

  private applyLightingPreset(preset: string): void {
    // Remove existing lights
    const lights = this.app.root.findComponents('light');
    lights.forEach((light) => light.entity.destroy());

    switch (preset) {
      case 'none':
        this.app.scene.ambientLight = new pc.Color(0, 0, 0);
        break;

      case 'studio': {
        this.app.scene.ambientLight = new pc.Color(0.1, 0.1, 0.1);

        const key = new pc.Entity('key');
        key.addComponent('light', {
          type: 'directional',
          color: new pc.Color(1, 1, 1),
          intensity: 1.0,
          castShadows: true,
        });
        key.setEulerAngles(45, -45, 0);
        this.app.root.addChild(key);

        const fill = new pc.Entity('fill');
        fill.addComponent('light', {
          type: 'directional',
          color: new pc.Color(1, 1, 1),
          intensity: 0.4,
        });
        fill.setEulerAngles(30, 45, 0);
        this.app.root.addChild(fill);
        break;
      }

      case 'outdoor': {
        this.app.scene.ambientLight = new pc.Color(0.3, 0.35, 0.4);

        const sun = new pc.Entity('sun');
        sun.addComponent('light', {
          type: 'directional',
          color: new pc.Color(1, 0.95, 0.9),
          intensity: 1.2,
          castShadows: true,
        });
        sun.setEulerAngles(60, 30, 0);
        this.app.root.addChild(sun);
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
   * Start the application
   */
  start(): void {
    this.app.start();

    // Update loop
    this.app.on('update', (dt: number) => {
      if (this.holoRuntime) {
        (this.holoRuntime as any).update?.(dt);
      }
    });
  }

  /**
   * Stop the application
   */
  stop(): void {
    this.app.off('update');
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
      if (this.app.xr.isAvailable(pc.XRTYPE_VR)) {
        this.camera.camera!.startXr(pc.XRTYPE_VR, pc.XRSPACE_LOCAL);
      }
    } catch (error) {
      console.error('Failed to enter XR:', error);
    }
  }

  /**
   * Get the PlayCanvas application
   */
  getApp(): pc.Application {
    return this.app;
  }

  /**
   * Get the camera entity
   */
  getCamera(): pc.Entity {
    return this.camera;
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
   * Dispose resources
   */
  dispose(): void {
    this.stop();

    if (this.holoRuntime) {
      this.holoRuntime.unmount();
      this.holoRuntime = null;
    }

    this.playcanvasRenderer.dispose();
    this.app.destroy();
  }
}

/**
 * Create a new HoloScript World with PlayCanvas
 */
export function createWorld(options: WorldOptions): World {
  return new World(options);
}
