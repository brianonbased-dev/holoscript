/**
 * HoloScript Deploy Service
 * 
 * Client-side API for deploying HoloScript to various platforms.
 * Actual compilation happens on backend services (infinityassistant.io).
 * 
 * Supported Deploy Targets:
 * - Web (React, Next.js) - Local compilation
 * - React Three Fiber - Local compilation
 * - Flutter - Backend required
 * - SwiftUI - Backend required
 * - Jetpack Compose - Backend required
 * - Unity - Backend required
 * - Unreal Engine - Backend required
 * - Godot - Backend required
 * - Native VR (Quest, Vision Pro) - Backend required
 */

export type DeployTarget = 
  | 'web'
  | 'react-three-fiber'
  | 'flutter'
  | 'swiftui'
  | 'jetpack-compose'
  | 'unity'
  | 'unreal'
  | 'godot'
  | 'quest-native'
  | 'vision-pro';

export interface DeployConfig {
  target: DeployTarget;
  holoScript: string;
  options?: {
    minify?: boolean;
    optimize?: boolean;
    debug?: boolean;
    outputDir?: string;
  };
}

export interface DeployResult {
  success: boolean;
  target: DeployTarget;
  code?: string;
  files?: Array<{ path: string; content: string }>;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    compilationTime: number;
    outputSize: number;
    dependencies: string[];
  };
}

export interface DeployServiceConfig {
  /** Backend API URL (defaults to infinityassistant.io) */
  apiUrl?: string;
  /** API key for backend authentication */
  apiKey?: string;
  /** Enable local compilation where supported */
  enableLocalCompilation?: boolean;
}

/**
 * Deploy Service for compiling HoloScript to various targets
 */
export class DeployService {
  private config: Required<DeployServiceConfig>;

  // Targets that can be compiled locally
  private static LOCAL_TARGETS: DeployTarget[] = ['web', 'react-three-fiber'];

  constructor(config: DeployServiceConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl ?? 'https://api.infinityassistant.io/v1/deploy',
      apiKey: config.apiKey ?? '',
      enableLocalCompilation: config.enableLocalCompilation ?? true,
    };
  }

  /**
   * Deploy HoloScript to a target platform
   */
  async deploy(config: DeployConfig): Promise<DeployResult> {
    const { target, holoScript, options } = config;

    // Check if local compilation is available
    if (this.config.enableLocalCompilation && DeployService.LOCAL_TARGETS.includes(target)) {
      return this.compileLocally(target, holoScript, options);
    }

    // Otherwise, use backend API
    return this.compileRemotely(target, holoScript, options);
  }

  /**
   * Get supported targets and their availability
   */
  getSupportedTargets(): Array<{ target: DeployTarget; local: boolean; requiresBackend: boolean }> {
    const allTargets: DeployTarget[] = [
      'web', 'react-three-fiber', 'flutter', 'swiftui', 
      'jetpack-compose', 'unity', 'unreal', 'godot',
      'quest-native', 'vision-pro'
    ];

    return allTargets.map(target => ({
      target,
      local: DeployService.LOCAL_TARGETS.includes(target),
      requiresBackend: !DeployService.LOCAL_TARGETS.includes(target),
    }));
  }

  /**
   * Compile locally for web targets
   */
  private async compileLocally(
    target: DeployTarget, 
    holoScript: string, 
    options?: DeployConfig['options']
  ): Promise<DeployResult> {
    const startTime = performance.now();

    try {
      let code = '';

      if (target === 'web') {
        code = this.compileToWeb(holoScript, options);
      } else if (target === 'react-three-fiber') {
        code = this.compileToR3F(holoScript, options);
      }

      return {
        success: true,
        target,
        code,
        metadata: {
          compilationTime: performance.now() - startTime,
          outputSize: code.length,
          dependencies: this.extractDependencies(target),
        },
      };
    } catch (error) {
      return {
        success: false,
        target,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Compile remotely via backend API
   */
  private async compileRemotely(
    target: DeployTarget,
    holoScript: string,
    options?: DeployConfig['options']
  ): Promise<DeployResult> {
    if (!this.config.apiKey) {
      return {
        success: false,
        target,
        errors: [`Backend compilation for ${target} requires API key. Visit infinityassistant.io to get one.`],
      };
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ target, holoScript, options }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        target,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Compile to vanilla web (HTML/JS)
   */
  private compileToWeb(holoScript: string, _options?: DeployConfig['options']): string {
    // Placeholder - actual implementation would transform AST to vanilla JS
    return `// Generated from HoloScript
// Source: ${holoScript.substring(0, 100)}...

export function createScene() {
  // TODO: Implement scene generation from HoloScript AST
  console.log('HoloScript scene initialized');
}
`;
  }

  /**
   * Compile to React Three Fiber
   */
  private compileToR3F(holoScript: string, _options?: DeployConfig['options']): string {
    // Placeholder - actual implementation would transform AST to R3F components
    return `// Generated React Three Fiber from HoloScript
import { Canvas } from '@react-three/fiber';

export function Scene() {
  // TODO: Generate scene from HoloScript
  return (
    <Canvas>
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}
`;
  }

  /**
   * Extract dependencies for a target
   */
  private extractDependencies(target: DeployTarget): string[] {
    const deps: Record<DeployTarget, string[]> = {
      'web': [],
      'react-three-fiber': ['@react-three/fiber', '@react-three/drei', 'three'],
      'flutter': ['flutter_holoscript'],
      'swiftui': [],
      'jetpack-compose': ['holoscript-android'],
      'unity': ['HoloScript.Unity'],
      'unreal': ['HoloScriptUE'],
      'godot': ['holoscript-godot'],
      'quest-native': ['holoscript-quest-sdk'],
      'vision-pro': ['holoscript-visionos'],
    };
    return deps[target] ?? [];
  }
}

/**
 * Create a deploy service instance
 */
export function createDeployService(config?: DeployServiceConfig): DeployService {
  return new DeployService(config);
}
