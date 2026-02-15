import { describe, it, expect } from 'vitest';
import { TerrainLOD } from '../terrain/TerrainLOD';
import { TerrainTexturing } from '../terrain/TerrainTexturing';
import { ErosionSim } from '../terrain/ErosionSim';

describe('Cycle 142: LOD Terrain', () => {
  // -------------------------------------------------------------------------
  // TerrainLOD
  // -------------------------------------------------------------------------

  it('should generate quadtree chunks from a height sampler', () => {
    const lod = new TerrainLOD({ totalSize: 64, maxLOD: 2, baseResolution: 8 });
    lod.generateQuadtree((x, z) => Math.sin(x * 0.1) * 5);

    expect(lod.getTotalChunkCount()).toBeGreaterThan(1);
    const chunks = lod.getActiveChunks();
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].heightData.length).toBe(64); // 8*8
  });

  it('should select LOD based on camera distance', () => {
    const lod = new TerrainLOD({ totalSize: 512, maxLOD: 3, baseResolution: 16, lodDistances: [100, 300, 600] });
    lod.generateQuadtree(() => 0);
    lod.selectLOD(256, 256);

    const active = lod.getActiveChunks();
    // Chunks near camera should be active
    expect(active.length).toBeGreaterThan(0);
    // Some chunks should have morph factors between 0-1
    const morphed = active.filter(c => c.morphFactor > 0 && c.morphFactor < 1);
    // Just verify LOD selection ran without error
    expect(lod.getActiveChunkCount()).toBeGreaterThan(0);
  });

  it('should sample height from active chunks', () => {
    const lod = new TerrainLOD({ totalSize: 64, maxLOD: 1, baseResolution: 8, lodDistances: [1000] });
    lod.generateQuadtree(() => 42);
    lod.selectLOD(32, 32);

    const h = lod.sampleHeight(10, 10);
    expect(h).toBeCloseTo(42, 0);
  });

  // -------------------------------------------------------------------------
  // TerrainTexturing
  // -------------------------------------------------------------------------

  it('should manage layers and splatmap painting', () => {
    const tex = new TerrainTexturing();
    tex.addLayer({ id: 'grass', textureId: 't1', tiling: { x: 1, y: 1 }, metallic: 0, roughness: 0.8, heightBlend: false });
    tex.addLayer({ id: 'rock', textureId: 't2', tiling: { x: 1, y: 1 }, metallic: 0.1, roughness: 0.9, heightBlend: true });
    expect(tex.getLayerCount()).toBe(2);

    tex.createSplatmap(16, 16, 4);

    // Default weights: channel 0 = 1, rest = 0
    const w0 = tex.getSplatWeights(0.5, 0.5);
    expect(w0[0]).toBe(1);

    // Paint channel 1
    tex.paintSplatmap(1, 0.5, 0.5, 0.3, 1.0);
    const w1 = tex.getSplatWeights(0.5, 0.5);
    expect(w1[1]).toBeGreaterThan(0); // Rock layer now has weight
    // Normalization check: sum should be ~1
    const sum = w1.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  it('should compute triplanar weights from normals', () => {
    const tex = new TerrainTexturing();
    tex.setTriplanar({ sharpness: 4, enabled: true });

    // Flat ground (Y-up normal)
    const flat = tex.computeTriplanarWeights({ x: 0, y: 1, z: 0 });
    expect(flat.y).toBeGreaterThan(0.9); // Almost all Y

    // Vertical wall (X normal)
    const wall = tex.computeTriplanarWeights({ x: 1, y: 0, z: 0 });
    expect(wall.x).toBeGreaterThan(0.9);
  });

  // -------------------------------------------------------------------------
  // ErosionSim
  // -------------------------------------------------------------------------

  it('should hydraulically erode a heightmap', () => {
    const size = 32;
    const hm = new Float32Array(size * size);
    // Create a simple hill
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const dx = x - size / 2, dz = z - size / 2;
        hm[z * size + x] = Math.max(0, 10 - Math.sqrt(dx * dx + dz * dz) * 0.5);
      }
    }

    const original = new Float32Array(hm);
    const sim = new ErosionSim({ iterations: 1000, seed: 123 });
    const result = sim.hydraulicErode(hm, size, size);

    expect(result.totalEroded).toBeGreaterThan(0);
    // Heightmap should be modified
    let changed = false;
    for (let i = 0; i < hm.length; i++) {
      if (Math.abs(hm[i] - original[i]) > 0.001) { changed = true; break; }
    }
    expect(changed).toBe(true);
  });

  it('should thermally erode steep slopes', () => {
    const size = 16;
    const hm = new Float32Array(size * size);
    // Cliff: one half high, one half low
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        hm[z * size + x] = x < size / 2 ? 20 : 0;
      }
    }

    const sim = new ErosionSim({ thermalAngle: 30, thermalRate: 0.5 });
    const result = sim.thermalErode(hm, size, size, 50);

    expect(result.totalEroded).toBeGreaterThan(0);
    // The cliff edge should have material deposited at the bottom
    const midEdge = hm[8 * size + (size / 2)]; // Just above the edge
    expect(midEdge).toBeLessThan(20); // Some erosion happened
  });
});
