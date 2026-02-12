/**
 * @holoscript/core Movement Predictor
 *
 * Predicts the player's path based on current velocity and orientation.
 * Used by the AssetStreamer to prioritize background loading.
 */

import { Vector3 } from '../types/HoloScriptPlus';

export interface IntentSignal {
  target: Vector3;
  weight: number; // 0-1 (confidence in intent)
}

export class MovementPredictor {
  private lastPosition: Vector3 = [0, 0, 0];
  private velocity: Vector3 = [0, 0, 0];
  private history: Vector3[] = [];
  private maxHistory: number = 60; // 1 second at 60fps
  private intent: IntentSignal | null = null;

  /**
   * Update internal state with current player transform
   */
  public update(position: Vector3, dt: number): void {
    const currentPos: Vector3 = Array.isArray(position)
      ? [...position]
      : [position.x, position.y, position.z];

    if (dt > 0) {
      this.velocity = [
        ((currentPos as any)[0] - (this.lastPosition as any)[0]) / dt,
        ((currentPos as any)[1] - (this.lastPosition as any)[1]) / dt,
        ((currentPos as any)[2] - (this.lastPosition as any)[2]) / dt,
      ];
    }

    this.lastPosition = currentPos;

    // Tier 2: Update history buffer
    this.history.push([...currentPos]);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Set the player's current intent signal (Tier 3)
   */
  public setIntent(intent: IntentSignal | null): void {
    this.intent = intent;
  }

  /**
   * Tier 1: Linear Extrapolation
   */
  private predictLinear(lookahead: number): Vector3 {
    return [
      (this.lastPosition as any)[0] + (this.velocity as any)[0] * lookahead,
      (this.lastPosition as any)[1] + (this.velocity as any)[1] * lookahead,
      (this.lastPosition as any)[2] + (this.velocity as any)[2] * lookahead,
    ];
  }

  /**
   * Tier 2: Recurrent Placeholder (Non-linear pathing)
   * In a full implementation, this would use an LSTM/RNN.
   * Here we simulate it by analyzing the curvature of the history.
   */
  private predictRecurrent(lookahead: number): Vector3 {
    if (this.history.length < 10) return this.predictLinear(lookahead);

    // Calculate average acceleration (curvature)
    const midIdx = Math.floor(this.history.length / 2);
    const startPos = this.history[0];
    const midPos = this.history[midIdx];
    const endPos = this.history[this.history.length - 1];

    // Simple spline-like estimation
    const linearPred = this.predictLinear(lookahead);

    // If the path is curving, bias the prediction towards the curve
    const chord1 = [midPos[0] - startPos[0], midPos[1] - startPos[1], midPos[2] - startPos[2]];
    const chord2 = [endPos[0] - midPos[0], endPos[1] - midPos[1], endPos[2] - midPos[2]];

    const turnFactor = 0.5; // Simulated RNN weight
    const curveOffset: Vector3 = [
      (chord2[0] - chord1[0]) * lookahead * turnFactor,
      (chord2[1] - chord1[1]) * lookahead * turnFactor,
      (chord2[2] - chord1[2]) * lookahead * turnFactor,
    ];

    return [
      linearPred[0] + curveOffset[0],
      linearPred[1] + curveOffset[1],
      linearPred[2] + curveOffset[2],
    ];
  }

  /**
   * Tier 3: Intent-based biasing
   */
  private predictIntent(lookahead: number): Vector3 {
    const recurrent = this.predictRecurrent(lookahead);
    if (!this.intent) return recurrent;

    const targetPos = this.intent.target;
    const weight = this.intent.weight;

    // Interpolate between recurrent path and intent target
    return [
      recurrent[0] * (1 - weight) + (targetPos as any)[0] * weight,
      recurrent[1] * (1 - weight) + (targetPos as any)[1] * weight,
      recurrent[2] * (1 - weight) + (targetPos as any)[2] * weight,
    ];
  }

  /**
   * Get predictive windows for asset pre-fetching.
   * Combines all tiers into a prioritized set of windows.
   */
  public getPredictiveWindows(lookaheadSeconds: number): PredictiveWindow[] {
    const windows: PredictiveWindow[] = [];

    // 1. Ambient window (Tier 0: Immediate surroundings)
    windows.push({
      center: [...this.lastPosition],
      radius: 10,
      likelihood: 1.0,
    });

    const speed = Math.sqrt(
      (this.velocity as any)[0] ** 2 +
        (this.velocity as any)[1] ** 2 +
        (this.velocity as any)[2] ** 2
    );

    if (speed > 0.5) {
      // 2. Linear prediction (High confidence, short term)
      windows.push({
        center: this.predictLinear(lookaheadSeconds * 0.5),
        radius: speed * lookaheadSeconds * 0.3 + 5,
        likelihood: 0.9,
      });

      // 3. Ensembled/Intent prediction (Tier 3)
      const ensembleCenter = this.predictIntent(lookaheadSeconds);
      windows.push({
        center: ensembleCenter,
        radius: speed * lookaheadSeconds * 0.6 + 8,
        likelihood: 0.7,
      });
    }

    return windows;
  }
}
