import { describe, it, expect } from 'vitest';
import { ErosionSim } from '../terrain/ErosionSim';

// =============================================================================
// C219 — Terrain Erosion Simulation
// =============================================================================

function flatMap(width: number, height: number, baseHeight = 10): Float32Array {
  return new Float32Array(width * height).fill(baseHeight);
}

function slopedMap(width: number, height: number): Float32Array {
  const map = new Float32Array(width * height);
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      map[z * width + x] = (x + z) * 0.5; // gradient slope
    }
  }
  return map;
}

describe('ErosionSim', () => {
  it('constructor uses default config', () => {
    const sim = new ErosionSim();
    const cfg = sim.getConfig();
    expect(cfg.iterations).toBe(50000);
    expect(cfg.seed).toBe(42);
  });

  it('constructor merges partial config', () => {
    const sim = new ErosionSim({ iterations: 100, seed: 7 });
    const cfg = sim.getConfig();
    expect(cfg.iterations).toBe(100);
    expect(cfg.seed).toBe(7);
    expect(cfg.gravity).toBe(4); // default preserved
  });

  it('setConfig updates config', () => {
    const sim = new ErosionSim();
    sim.setConfig({ gravity: 10 });
    expect(sim.getConfig().gravity).toBe(10);
  });

  it('hydraulicErode returns valid result', () => {
    const sim = new ErosionSim({ iterations: 100 });
    const map = slopedMap(16, 16);
    const result = sim.hydraulicErode(map, 16, 16);
    expect(result.iterations).toBe(100);
    expect(result.totalEroded).toBeGreaterThanOrEqual(0);
    expect(result.totalDeposited).toBeGreaterThanOrEqual(0);
    expect(result.maxDepthChange).toBeGreaterThanOrEqual(0);
  });

  it('hydraulicErode modifies sloped heightmap', () => {
    const sim = new ErosionSim({ iterations: 500 });
    const map = slopedMap(16, 16);
    const original = new Float32Array(map);
    sim.hydraulicErode(map, 16, 16);
    // At least some pixels should differ
    let changed = false;
    for (let i = 0; i < map.length; i++) {
      if (map[i] !== original[i]) { changed = true; break; }
    }
    expect(changed).toBe(true);
  });

  it('hydraulicErode on flat map changes minimally', () => {
    const sim = new ErosionSim({ iterations: 100 });
    const map = flatMap(16, 16, 5);
    const result = sim.hydraulicErode(map, 16, 16);
    // Flat terrain — minimal erosion since water can't flow downhill
    expect(result.maxDepthChange).toBeLessThan(1);
  });

  it('thermalErode returns valid result', () => {
    const sim = new ErosionSim();
    const map = slopedMap(16, 16);
    const result = sim.thermalErode(map, 16, 16, 10);
    expect(result.iterations).toBe(10);
    expect(result.totalEroded).toBeGreaterThanOrEqual(0);
    expect(result.totalDeposited).toBeGreaterThanOrEqual(0);
  });

  it('thermalErode smooths steep terrain', () => {
    const sim = new ErosionSim({ thermalAngle: 10 });
    const map = new Float32Array(16 * 16);
    // Create a steep peak
    map[8 * 16 + 8] = 100;
    sim.thermalErode(map, 16, 16, 100);
    // Peak should be reduced
    expect(map[8 * 16 + 8]).toBeLessThan(100);
  });

  it('thermalErode preserves flat terrain', () => {
    const sim = new ErosionSim();
    const map = flatMap(16, 16, 5);
    const result = sim.thermalErode(map, 16, 16, 10);
    expect(result.totalEroded).toBe(0); // Nothing to erode on flat
  });

  it('deterministic with same seed', () => {
    const map1 = slopedMap(8, 8);
    const map2 = slopedMap(8, 8);
    const sim1 = new ErosionSim({ iterations: 100, seed: 42 });
    const sim2 = new ErosionSim({ iterations: 100, seed: 42 });
    sim1.hydraulicErode(map1, 8, 8);
    sim2.hydraulicErode(map2, 8, 8);
    for (let i = 0; i < map1.length; i++) {
      expect(map1[i]).toBe(map2[i]);
    }
  });

  it('different seeds produce different results', () => {
    const map1 = slopedMap(8, 8);
    const map2 = slopedMap(8, 8);
    new ErosionSim({ iterations: 200, seed: 1 }).hydraulicErode(map1, 8, 8);
    new ErosionSim({ iterations: 200, seed: 999 }).hydraulicErode(map2, 8, 8);
    let differs = false;
    for (let i = 0; i < map1.length; i++) {
      if (map1[i] !== map2[i]) { differs = true; break; }
    }
    expect(differs).toBe(true);
  });
});
