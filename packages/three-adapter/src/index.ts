/**
 * @holoscript/three-adapter
 *
 * Three.js rendering adapter for HoloScript
 *
 * @example Loading .hsplus files
 * ```typescript
 * import { createWorld } from '@holoscript/three-adapter';
 *
 * const world = createWorld({
 *   container: document.getElementById('app')!,
 *   xrEnabled: true,
 * });
 *
 * // Load a .hsplus file
 * await world.loadFile('/scenes/main.hsplus');
 * world.start();
 * ```
 *
 * @example Auto-load from directory (index.hsplus)
 * ```typescript
 * await world.loadDirectory('/scenes/level1');
 * // Automatically loads /scenes/level1/index.hsplus
 * ```
 *
 * @example Load from config manifest
 * ```typescript
 * await world.loadConfig('/project/holoscript.config.hsplus');
 * // Reads config and loads all specified files
 * ```
 *
 * @example Using @world trait in .hsplus files
 * ```hsplus
 * @world {
 *   backgroundColor: "#16213e"
 *   fog: { type: "linear", color: "#16213e", near: 10, far: 100 }
 *   xr: true
 *   shadows: "high"
 *   camera: { position: [0, 2, 10], fov: 60 }
 *   lighting: "outdoor"
 * }
 *
 * orb#player @grabbable {
 *   position: [0, 1, 0]
 *   color: "#00ffff"
 * }
 * ```
 */

export { ThreeRenderer } from './ThreeRenderer';
export type { Renderer } from './ThreeRenderer';

export { World, createWorld } from './World';
export type { WorldOptions, HoloScriptConfig, WorldTraitConfig } from './World';

export { PhysicsWorld, createPhysicsWorld } from './Physics';
export type { PhysicsBodyConfig, PhysicsEvent, PhysicsEventType } from './Physics';

/**
 * Create a World from a config file URL
 * Convenience function that loads config and returns ready-to-use world
 *
 * @example
 * ```typescript
 * const world = await createWorldFromConfig(
 *   document.getElementById('app')!,
 *   '/project/holoscript.config.hsplus'
 * );
 * // World is configured and files are loaded
 * // Just call world.start() if autoStart wasn't set
 * ```
 */
export async function createWorldFromConfig(
  container: HTMLElement,
  configPath: string
): Promise<import('./World').World> {
  const { World } = await import('./World');
  const basePath = configPath.substring(0, configPath.lastIndexOf('/') + 1);
  const world = new World({ container, basePath });
  await world.loadConfig(configPath);
  return world;
}

/**
 * Create a World and auto-load index.hsplus from a directory
 *
 * @example
 * ```typescript
 * const world = await createWorldFromDirectory(
 *   document.getElementById('app')!,
 *   '/scenes/level1'
 * );
 * world.start();
 * ```
 */
export async function createWorldFromDirectory(
  container: HTMLElement,
  directory: string,
  options?: Omit<import('./World').WorldOptions, 'container'>
): Promise<import('./World').World> {
  const { World } = await import('./World');
  const world = new World({ container, ...options });
  await world.loadDirectory(directory);
  return world;
}
