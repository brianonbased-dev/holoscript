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
  /** Base URL for loading .hsplus files (default: current location) */
  basePath?: string;
  /** Fog settings */
  fog?: { color: string; near: number; far: number } | { color: string; density: number };
  /** Ambient light intensity (0-1) */
  ambientIntensity?: number;
  /** Shadow quality: 'low' | 'medium' | 'high' | 'ultra' */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Config loaded from holoscript.config.hsplus
 */
export interface HoloScriptConfig {
  /** World settings to override */
  world?: Partial<Omit<WorldOptions, 'container'>>;
  /** Entry files to load */
  files?: string[];
  /** Assets directory */
  assets?: string;
  /** Whether to auto-start the render loop */
  autoStart?: boolean;
}

/**
 * @world trait configuration (parsed from .hsplus files)
 */
export interface WorldTraitConfig {
  backgroundColor?: string;
  fog?: { type: 'linear'; color: string; near: number; far: number } | { type: 'exponential'; color: string; density: number };
  xr?: boolean;
  shadows?: boolean | 'low' | 'medium' | 'high' | 'ultra';
  camera?: { position: [number, number, number]; fov?: number; near?: number; far?: number };
  ambient?: number;
  lighting?: 'default' | 'none' | 'studio' | 'outdoor';
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

  // Base path for loading files
  private basePath: string;

  // Config from holoscript.config.hsplus
  private config: HoloScriptConfig | null = null;

  constructor(options: WorldOptions) {
    this.basePath = options.basePath ?? '';
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
   * Auto-load index.hsplus from a directory
   * Convention over configuration - just point to a folder
   *
   * @example
   * await world.loadDirectory('/scenes/level1');
   * // Loads /scenes/level1/index.hsplus
   */
  async loadDirectory(path: string): Promise<void> {
    const basePath = path.endsWith('/') ? path : `${path}/`;
    const indexPath = `${basePath}index.hsplus`;

    try {
      await this.loadFile(indexPath);
    } catch (error) {
      throw new Error(`Failed to load index.hsplus from ${basePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Load holoscript.config.hsplus manifest file
   * Configures world settings and loads specified files
   *
   * @example Config file format:
   * ```hsplus
   * @config {
   *   world: {
   *     backgroundColor: "#1a1a2e"
   *     xrEnabled: true
   *     shadows: "high"
   *   }
   *   files: [
   *     "base.hsplus"
   *     "characters.hsplus"
   *     "environment.hsplus"
   *   ]
   *   assets: "./assets"
   *   autoStart: true
   * }
   * ```
   */
  async loadConfig(configPath?: string): Promise<HoloScriptConfig> {
    const path = configPath ?? `${this.basePath}holoscript.config.hsplus`;

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${path}: ${response.statusText}`);
    }

    const source = await response.text();
    const config = this.parseConfigFile(source);
    this.config = config;

    // Apply world settings
    if (config.world) {
      this.applyWorldSettings(config.world);
    }

    // Load entry files
    if (config.files && config.files.length > 0) {
      const baseDir = path.substring(0, path.lastIndexOf('/') + 1) || this.basePath;
      const fullPaths = config.files.map(f =>
        f.startsWith('/') || f.startsWith('http') ? f : `${baseDir}${f}`
      );
      await this.loadFiles(fullPaths);
    }

    // Auto-start if configured
    if (config.autoStart) {
      this.start();
    }

    return config;
  }

  /**
   * Parse holoscript.config.hsplus file format
   */
  private parseConfigFile(source: string): HoloScriptConfig {
    const config: HoloScriptConfig = {};

    // Match @config { ... } block
    const configMatch = source.match(/@config\s*\{([\s\S]*?)\n\}/);
    if (!configMatch) {
      // Try parsing as simple key-value
      return this.parseSimpleConfig(source);
    }

    const content = configMatch[1];

    // Parse world settings
    const worldMatch = content.match(/world\s*:\s*\{([\s\S]*?)\n\s*\}/);
    if (worldMatch) {
      config.world = this.parseConfigObject(worldMatch[1]);
    }

    // Parse files array
    const filesMatch = content.match(/files\s*:\s*\[([\s\S]*?)\]/);
    if (filesMatch) {
      config.files = this.parseConfigArray(filesMatch[1]);
    }

    // Parse assets path
    const assetsMatch = content.match(/assets\s*:\s*["']([^"']+)["']/);
    if (assetsMatch) {
      config.assets = assetsMatch[1];
    }

    // Parse autoStart
    const autoStartMatch = content.match(/autoStart\s*:\s*(true|false)/);
    if (autoStartMatch) {
      config.autoStart = autoStartMatch[1] === 'true';
    }

    return config;
  }

  /**
   * Parse simple key-value config format
   */
  private parseSimpleConfig(source: string): HoloScriptConfig {
    const config: HoloScriptConfig = {};
    const lines = source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

    for (const line of lines) {
      const match = line.match(/(\w+)\s*:\s*(.+)/);
      if (match) {
        const [, key, value] = match;
        if (key === 'files') {
          config.files = value.split(',').map(f => f.trim().replace(/["']/g, ''));
        } else if (key === 'autoStart') {
          config.autoStart = value.trim() === 'true';
        } else if (key === 'assets') {
          config.assets = value.trim().replace(/["']/g, '');
        }
      }
    }

    return config;
  }

  /**
   * Parse config object from string
   */
  private parseConfigObject(content: string): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

    for (const line of lines) {
      const match = line.match(/(\w+)\s*:\s*(.+)/);
      if (match) {
        const [, key, rawValue] = match;
        obj[key] = this.parseConfigValue(rawValue.trim());
      }
    }

    return obj;
  }

  /**
   * Parse array from config string
   */
  private parseConfigArray(content: string): string[] {
    const items: string[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

    for (const line of lines) {
      const match = line.match(/["']([^"']+)["']/);
      if (match) {
        items.push(match[1]);
      } else if (line && !line.startsWith('[') && !line.endsWith(']')) {
        items.push(line.replace(/,/g, '').trim());
      }
    }

    return items;
  }

  /**
   * Parse a single config value
   */
  private parseConfigValue(value: string): unknown {
    // Remove trailing comma
    value = value.replace(/,\s*$/, '');

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) return parseFloat(value);

    // String (quoted)
    const stringMatch = value.match(/^["']([^"']*)["']$/);
    if (stringMatch) return stringMatch[1];

    // Array
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      return inner.split(',').map(v => this.parseConfigValue(v.trim()));
    }

    return value;
  }

  /**
   * Apply world settings from config
   */
  private applyWorldSettings(settings: Partial<Omit<WorldOptions, 'container'>>): void {
    if (settings.backgroundColor !== undefined) {
      this.scene.background = new THREE.Color(settings.backgroundColor);
    }

    if (settings.fog) {
      if ('density' in settings.fog) {
        this.scene.fog = new THREE.FogExp2(new THREE.Color(settings.fog.color).getHex(), settings.fog.density);
      } else {
        this.scene.fog = new THREE.Fog(settings.fog.color, settings.fog.near, settings.fog.far);
      }
    }

    if (settings.cameraPosition) {
      this.camera.position.set(...settings.cameraPosition);
    }

    if (settings.shadowQuality) {
      this.applyShadowQuality(settings.shadowQuality);
    }
  }

  /**
   * Apply shadow quality setting
   */
  private applyShadowQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    const sizes: Record<string, number> = {
      low: 512,
      medium: 1024,
      high: 2048,
      ultra: 4096,
    };

    const mapSize = sizes[quality] || 2048;

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Light && (obj as THREE.Light & { shadow?: THREE.LightShadow }).shadow) {
        const shadow = (obj as THREE.Light & { shadow: THREE.LightShadow }).shadow;
        shadow.mapSize.width = mapSize;
        shadow.mapSize.height = mapSize;
      }
    });
  }

  /**
   * Extract and apply @world trait from source code
   * Called automatically when loading .hsplus files
   *
   * @example
   * ```hsplus
   * @world {
   *   backgroundColor: "#16213e"
   *   fog: { type: "linear", color: "#16213e", near: 10, far: 100 }
   *   xr: true
   *   shadows: "high"
   *   camera: { position: [0, 2, 10], fov: 60 }
   *   ambient: 0.5
   *   lighting: "outdoor"
   * }
   *
   * orb#player @grabbable {
   *   position: [0, 1, 0]
   * }
   * ```
   */
  private extractWorldTrait(source: string): WorldTraitConfig | null {
    // Match @world { ... } block at the start of the file
    const worldMatch = source.match(/@world\s*\{([\s\S]*?)\n\}/);
    if (!worldMatch) return null;

    const content = worldMatch[1];
    const config: WorldTraitConfig = {};

    // Parse backgroundColor
    const bgMatch = content.match(/backgroundColor\s*:\s*["']([^"']+)["']/);
    if (bgMatch) {
      config.backgroundColor = bgMatch[1];
    }

    // Parse xr
    const xrMatch = content.match(/xr\s*:\s*(true|false)/);
    if (xrMatch) {
      config.xr = xrMatch[1] === 'true';
    }

    // Parse shadows
    const shadowsMatch = content.match(/shadows\s*:\s*(?:(true|false)|["'](\w+)["'])/);
    if (shadowsMatch) {
      if (shadowsMatch[1]) {
        config.shadows = shadowsMatch[1] === 'true';
      } else if (shadowsMatch[2]) {
        config.shadows = shadowsMatch[2] as 'low' | 'medium' | 'high' | 'ultra';
      }
    }

    // Parse ambient
    const ambientMatch = content.match(/ambient\s*:\s*([\d.]+)/);
    if (ambientMatch) {
      config.ambient = parseFloat(ambientMatch[1]);
    }

    // Parse lighting preset
    const lightingMatch = content.match(/lighting\s*:\s*["'](\w+)["']/);
    if (lightingMatch) {
      config.lighting = lightingMatch[1] as WorldTraitConfig['lighting'];
    }

    // Parse camera
    const cameraMatch = content.match(/camera\s*:\s*\{([^}]+)\}/);
    if (cameraMatch) {
      const cameraConfig: any = {};
      const posMatch = cameraMatch[1].match(/position\s*:\s*\[([^\]]+)\]/);
      if (posMatch) {
        cameraConfig.position = posMatch[1].split(',').map(n => parseFloat(n.trim())) as [number, number, number];
      }
      const fovMatch = cameraMatch[1].match(/fov\s*:\s*([\d.]+)/);
      if (fovMatch) cameraConfig.fov = parseFloat(fovMatch[1]);
      const nearMatch = cameraMatch[1].match(/near\s*:\s*([\d.]+)/);
      if (nearMatch) cameraConfig.near = parseFloat(nearMatch[1]);
      const farMatch = cameraMatch[1].match(/far\s*:\s*([\d.]+)/);
      if (farMatch) cameraConfig.far = parseFloat(farMatch[1]);
      config.camera = cameraConfig;
    }

    // Parse fog
    const fogMatch = content.match(/fog\s*:\s*\{([^}]+)\}/);
    if (fogMatch) {
      const fogContent = fogMatch[1];
      const typeMatch = fogContent.match(/type\s*:\s*["'](\w+)["']/);
      const colorMatch = fogContent.match(/color\s*:\s*["']([^"']+)["']/);
      const fogType = typeMatch?.[1] || 'linear';
      const fogColor = colorMatch?.[1] || '#ffffff';

      if (fogType === 'exponential') {
        const densityMatch = fogContent.match(/density\s*:\s*([\d.]+)/);
        config.fog = { type: 'exponential', color: fogColor, density: parseFloat(densityMatch?.[1] || '0.02') };
      } else {
        const nearMatch = fogContent.match(/near\s*:\s*([\d.]+)/);
        const farMatch = fogContent.match(/far\s*:\s*([\d.]+)/);
        config.fog = {
          type: 'linear',
          color: fogColor,
          near: parseFloat(nearMatch?.[1] || '10'),
          far: parseFloat(farMatch?.[1] || '100')
        };
      }
    }

    return config;
  }

  /**
   * Apply @world trait configuration to the scene
   */
  private applyWorldTrait(config: WorldTraitConfig): void {
    // Background color
    if (config.backgroundColor) {
      this.scene.background = new THREE.Color(config.backgroundColor);
    }

    // Fog
    if (config.fog) {
      if (config.fog.type === 'exponential') {
        this.scene.fog = new THREE.FogExp2(new THREE.Color(config.fog.color).getHex(), config.fog.density);
      } else {
        this.scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
      }
    }

    // Camera
    if (config.camera) {
      if (config.camera.position) {
        this.camera.position.set(...config.camera.position);
      }
      if (config.camera.fov !== undefined) {
        this.camera.fov = config.camera.fov;
        this.camera.updateProjectionMatrix();
      }
      if (config.camera.near !== undefined) {
        this.camera.near = config.camera.near;
        this.camera.updateProjectionMatrix();
      }
      if (config.camera.far !== undefined) {
        this.camera.far = config.camera.far;
        this.camera.updateProjectionMatrix();
      }
    }

    // Shadows
    if (config.shadows !== undefined) {
      if (typeof config.shadows === 'boolean') {
        this.renderer.shadowMap.enabled = config.shadows;
      } else {
        this.renderer.shadowMap.enabled = true;
        this.applyShadowQuality(config.shadows);
      }
    }

    // Ambient
    if (config.ambient !== undefined) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.AmbientLight) {
          obj.intensity = config.ambient!;
        }
      });
    }

    // Lighting preset
    if (config.lighting) {
      this.applyLightingPreset(config.lighting);
    }
  }

  /**
   * Apply a lighting preset
   */
  private applyLightingPreset(preset: 'default' | 'none' | 'studio' | 'outdoor'): void {
    // Remove existing lights
    const lightsToRemove: THREE.Light[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Light) {
        lightsToRemove.push(obj);
      }
    });
    lightsToRemove.forEach(light => this.scene.remove(light));

    switch (preset) {
      case 'none':
        // No lights
        break;

      case 'studio':
        // Three-point studio lighting
        const key = new THREE.DirectionalLight(0xffffff, 1.0);
        key.position.set(5, 5, 5);
        key.castShadow = true;
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xffffff, 0.4);
        fill.position.set(-5, 3, 0);
        this.scene.add(fill);

        const back = new THREE.DirectionalLight(0xffffff, 0.3);
        back.position.set(0, 3, -5);
        this.scene.add(back);

        const studioAmbient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(studioAmbient);
        break;

      case 'outdoor':
        // Sun + sky hemisphere
        const sun = new THREE.DirectionalLight(0xfffef0, 1.2);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);

        const sky = new THREE.HemisphereLight(0x87ceeb, 0x3c5f2e, 0.6);
        this.scene.add(sky);
        break;

      case 'default':
      default:
        this.setupDefaultLighting();
        break;
    }
  }

  /**
   * Strip @world trait from source (so parser doesn't see it)
   */
  private stripWorldTrait(source: string): string {
    return source.replace(/@world\s*\{[\s\S]*?\n\}/, '').trim();
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
