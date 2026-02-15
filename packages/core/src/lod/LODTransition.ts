/**
 * LODTransition.ts
 *
 * LOD transition effects: crossfade, dithering,
 * morph-based transitions, and hysteresis bands.
 *
 * @module lod
 */

// =============================================================================
// TYPES
// =============================================================================

export type TransitionMode = 'instant' | 'crossfade' | 'dither' | 'morph';

export interface LODTransitionConfig {
  mode: TransitionMode;
  duration: number;         // Seconds for transition
  hysteresisBand: number;   // Distance band to prevent flip-flopping
}

export interface TransitionState {
  entityId: string;
  fromLOD: number;
  toLOD: number;
  progress: number;         // 0-1
  active: boolean;
}

// =============================================================================
// LOD TRANSITION
// =============================================================================

export class LODTransition {
  private config: LODTransitionConfig;
  private transitions: Map<string, TransitionState> = new Map();

  constructor(config?: Partial<LODTransitionConfig>) {
    this.config = { mode: 'crossfade', duration: 0.5, hysteresisBand: 5, ...config };
  }

  // ---------------------------------------------------------------------------
  // Transition Management
  // ---------------------------------------------------------------------------

  startTransition(entityId: string, fromLOD: number, toLOD: number): void {
    if (this.config.mode === 'instant') {
      this.transitions.set(entityId, { entityId, fromLOD, toLOD, progress: 1, active: false });
      return;
    }

    this.transitions.set(entityId, { entityId, fromLOD, toLOD, progress: 0, active: true });
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  update(dt: number): void {
    for (const state of this.transitions.values()) {
      if (!state.active) continue;
      state.progress = Math.min(1, state.progress + dt / this.config.duration);
      if (state.progress >= 1) state.active = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Blend Values
  // ---------------------------------------------------------------------------

  getBlendFactor(entityId: string): number {
    const state = this.transitions.get(entityId);
    if (!state) return 1;

    switch (this.config.mode) {
      case 'instant': return 1;
      case 'crossfade': return state.progress;
      case 'dither': return state.progress > 0.5 ? 1 : 0; // Binary threshold for dither patterns
      case 'morph': return this.smoothstep(state.progress);
    }
  }

  getDitherThreshold(entityId: string): number {
    const state = this.transitions.get(entityId);
    return state ? state.progress : 1;
  }

  // ---------------------------------------------------------------------------
  // Hysteresis  
  // ---------------------------------------------------------------------------

  shouldTransition(currentDist: number, threshold: number, currentLOD: number, newLOD: number): boolean {
    const band = this.config.hysteresisBand;
    if (newLOD > currentLOD) {
      return currentDist > threshold + band;
    }
    return currentDist < threshold - band;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private smoothstep(t: number): number { return t * t * (3 - 2 * t); }

  isTransitioning(entityId: string): boolean { return this.transitions.get(entityId)?.active ?? false; }
  getTransitionState(entityId: string): TransitionState | undefined { return this.transitions.get(entityId); }
  getMode(): TransitionMode { return this.config.mode; }
  setMode(mode: TransitionMode): void { this.config.mode = mode; }
}
