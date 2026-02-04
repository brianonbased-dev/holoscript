/**
 * Type declarations for external @hololand packages
 * These packages are published separately in the Hololand repository
 */

declare module '@hololand/voice' {
  export class SpeechRecognizer {
    constructor(config: { backend: 'whisper' | 'browser' | 'auto' });
    initialize(): Promise<void>;
    start(): void;
    stop(): void;
  }

  export class TextToSpeech {
    constructor(config: { backend: 'browser' | 'elevenlabs' | 'azure'; apiKey?: string });
    speak(text: string): Promise<void>;
  }
}

declare module '@hololand/gpu' {
  export class FlowFieldCompute {
    constructor(config: { width: number; height: number; cellSize: number });
    initialize(): Promise<void>;
    compute(goal: { x: number; y: number }): Float32Array;
  }

  export class GPUContext {
    constructor(config: { powerPreference: 'low-power' | 'high-performance' });
    initialize(): Promise<void>;
    destroy(): void;
  }
}

declare module '@hololand/navigation' {
  export class FlowFieldGenerator {
    constructor(config: { width: number; height: number; cellSize: number });
    generate(obstacles: Array<{ x: number; y: number; radius: number }>): Float32Array;
  }
}

declare module '@hololand/gestures' {
  export class FrustrationEstimator {
    constructor(config: { frustrationThreshold: number });
    update(handData: unknown): number;
  }
}

declare module '@hololand/network' {
  export function createNetworkManager(config: unknown): unknown;
}

declare module '@hololand/vrchat-export' {
  export function exportToVRChat(scene: unknown): Promise<Uint8Array>;
}

declare module '@hololand/three-adapter' {
  export function createWorld(config: unknown): unknown;
}
