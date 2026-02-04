/**
 * @holoscript/core Movement Predictor
 *
 * Predicts the player's path based on current velocity and orientation.
 * Used by the AssetStreamer to prioritize background loading.
 */

import { Vector3 } from '../types/HoloScriptPlus';

export interface PredictiveWindow {
  center: Vector3;
  radius: number;
  likelihood: number; // 0-1
}

export class MovementPredictor {
  private lastPosition: Vector3 = [0, 0, 0];
  private velocity: Vector3 = [0, 0, 0];
  
  /**
   * Update internal state with current player transform
   */
  public update(position: Vector3, dt: number): void {
    if (dt > 0) {
      const distance = Math.sqrt(
        Math.pow((position as any)[0] - (this.lastPosition as any)[0], 2) +
        Math.pow((position as any)[1] - (this.lastPosition as any)[1], 2) +
        Math.pow((position as any)[2] - (this.lastPosition as any)[2], 2)
      );
      this.velocity = [
        ((position as any)[0] - (this.lastPosition as any)[0]) / dt,
        ((position as any)[1] - (this.lastPosition as any)[1]) / dt,
        ((position as any)[2] - (this.lastPosition as any)[2]) / dt,
      ];
    }
    this.lastPosition = Array.isArray(position) ? [...position] : [position.x, position.y, position.z] as any;
  }

  /**
   * Get predictive windows for asset pre-fetching.
   * Returns a primary window (cone of movement) and a secondary window (ambient).
   */
  public getPredictiveWindows(lookaheadSeconds: number): PredictiveWindow[] {
    const windows: PredictiveWindow[] = [];
    
    // 1. Ambient window (Always load things very close to player)
    windows.push({
      center: Array.isArray(this.lastPosition) ? [...this.lastPosition] : [(this.lastPosition as any).x, (this.lastPosition as any).y, (this.lastPosition as any).z],
      radius: 10,
      likelihood: 1.0
    });

    // 2. Velocity-based window (Predict ahead)
    const speed = Math.sqrt((this.velocity as any)[0]**2 + (this.velocity as any)[1]**2 + (this.velocity as any)[2]**2);
    if (speed > 0.5) {
      const prediction: Vector3 = [
        (this.lastPosition as any)[0] + (this.velocity as any)[0] * lookaheadSeconds,
        (this.lastPosition as any)[1] + (this.velocity as any)[1] * lookaheadSeconds,
        (this.lastPosition as any)[2] + (this.velocity as any)[2] * lookaheadSeconds
      ];

      windows.push({
        center: prediction,
        radius: speed * lookaheadSeconds * 0.5 + 5, // Wider window for higher speeds
        likelihood: 0.8
      });
    }

    return windows;
  }
}
