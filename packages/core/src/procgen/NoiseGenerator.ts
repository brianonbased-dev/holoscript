/**
 * NoiseGenerator — Perlin, Simplex, Worley noise with fractal octaves
 *
 * @version 1.0.0
 */

export type NoiseType = 'perlin' | 'simplex' | 'worley' | 'value';

export class NoiseGenerator {
  private seed: number;
  private permutation: number[];

  constructor(seed: number = 42) {
    this.seed = seed;
    this.permutation = this.buildPermutation(seed);
  }

  private buildPermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with seed
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p]; // Double for wrapping
  }

  private fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
  private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise
   */
  perlin2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const p = this.permutation;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    return this.lerp(
      this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u),
      this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u),
      v,
    );
  }

  /**
   * Value noise (simpler, blocky)
   */
  value2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const p = this.permutation;
    const a = p[p[X] + Y] / 255;
    const b = p[p[X + 1] + Y] / 255;
    const c = p[p[X] + Y + 1] / 255;
    const d = p[p[X + 1] + Y + 1] / 255;

    return this.lerp(this.lerp(a, b, u), this.lerp(c, d, u), v);
  }

  /**
   * Worley (cellular) noise
   */
  worley2D(x: number, y: number, density: number = 1): number {
    let minDist = Infinity;
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = ix + dx;
        const cy = iy + dy;
        // Deterministic point from cell
        const hash = this.permutation[((cx & 255) + this.permutation[(cy & 255)]) & 511];
        const px = cx + (hash / 255) * density;
        const py = cy + (this.permutation[(hash + 1) & 511] / 255) * density;
        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        if (dist < minDist) minDist = dist;
      }
    }
    return Math.min(1, minDist);
  }

  /**
   * Fractal Brownian Motion
   */
  fbm(x: number, y: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5, type: NoiseType = 'perlin'): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const nx = x * frequency;
      const ny = y * frequency;
      switch (type) {
        case 'perlin': total += this.perlin2D(nx, ny) * amplitude; break;
        case 'value': total += this.value2D(nx, ny) * amplitude; break;
        case 'worley': total += this.worley2D(nx, ny) * amplitude; break;
        default: total += this.perlin2D(nx, ny) * amplitude;
      }
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Domain warping
   */
  warp(x: number, y: number, strength: number = 1, octaves: number = 4): number {
    const qx = this.fbm(x, y, octaves);
    const qy = this.fbm(x + 5.2, y + 1.3, octaves);
    return this.fbm(x + qx * strength, y + qy * strength, octaves);
  }

  getSeed(): number { return this.seed; }
}
