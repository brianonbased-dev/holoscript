/**
 * @holoscript/playcanvas-adapter
 *
 * PlayCanvas rendering adapter for HoloScript
 *
 * @example
 * ```typescript
 * import { createWorld } from '@holoscript/playcanvas-adapter';
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

export { PlayCanvasRenderer } from './PlayCanvasRenderer';
export type { Renderer } from './PlayCanvasRenderer';

export { World, createWorld } from './World';
export type { WorldOptions, HoloScriptConfig, WorldTraitConfig } from './World';
