/**
 * @holoscript/three-adapter
 *
 * Three.js rendering adapter for HoloScript
 *
 * @example
 * ```typescript
 * import { createWorld } from '@holoscript/three-adapter';
 *
 * const world = createWorld({
 *   container: document.getElementById('canvas-container')!,
 *   xrEnabled: true,
 * });
 *
 * world.loadSource(`
 *   scene#main {
 *     orb#sphere @grabbable {
 *       position: [0, 1, 0]
 *       color: "#00ffff"
 *       size: 0.5
 *     }
 *   }
 * `);
 *
 * world.start();
 * ```
 */

export { ThreeRenderer } from './ThreeRenderer';
export type { Renderer } from './ThreeRenderer';

export { World, createWorld } from './World';
export type { WorldOptions } from './World';
