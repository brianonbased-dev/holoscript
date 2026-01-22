/**
 * @holoscript/babylon-adapter
 *
 * Babylon.js rendering adapter for HoloScript
 *
 * @example
 * ```typescript
 * import { createWorld } from '@holoscript/babylon-adapter';
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const world = createWorld({
 *   canvas,
 *   xrEnabled: true,
 * });
 *
 * await world.loadFile('/scenes/main.hsplus');
 * world.start();
 * ```
 */

export { BabylonRenderer } from './BabylonRenderer';
export type { Renderer } from './BabylonRenderer';

export { World, createWorld } from './World';
export type { WorldOptions, HoloScriptConfig, WorldTraitConfig } from './World';
