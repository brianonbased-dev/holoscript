/**
 * PluginAPI — Safe runtime API surface for plugins
 *
 * Provides a sandboxed interface that plugins use to interact with
 * the engine. Enforces permission checks and exposes event hooks,
 * asset registration, and state access.
 *
 * @version 1.0.0
 */

import type { PluginPermission } from './PluginLoader';

// =============================================================================
// TYPES
// =============================================================================

export interface PluginEventHandler {
  event: string;
  handler: (payload: unknown) => void;
  pluginId: string;
}

export interface PluginAsset {
  id: string;
  type: 'mesh' | 'texture' | 'audio' | 'script' | 'shader' | 'data';
  path: string;
  pluginId: string;
  metadata?: Record<string, unknown>;
}

export interface PluginCommand {
  id: string;
  name: string;
  description?: string;
  handler: (...args: unknown[]) => unknown;
  pluginId: string;
}

export interface PluginAPIConfig {
  pluginId: string;
  permissions: PluginPermission[];
}

// =============================================================================
// PLUGIN API
// =============================================================================

export class PluginAPI {
  private eventHandlers: PluginEventHandler[] = [];
  private assets: Map<string, PluginAsset> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private stateStore: Map<string, Map<string, unknown>> = new Map();
  private config: PluginAPIConfig;

  constructor(config: PluginAPIConfig) {
    this.config = config;
  }

  /**
   * Check if the plugin has a specific permission
   */
  hasPermission(permission: PluginPermission): boolean {
    return this.config.permissions.includes(permission);
  }

  /**
   * Require a permission or throw
   */
  private requirePermission(permission: PluginPermission): void {
    if (!this.hasPermission(permission)) {
      throw new Error(
        `Plugin "${this.config.pluginId}" lacks permission "${permission}"`
      );
    }
  }

  // ===========================================================================
  // EVENT SYSTEM
  // ===========================================================================

  /**
   * Subscribe to an engine event
   */
  on(event: string, handler: (payload: unknown) => void): void {
    this.eventHandlers.push({
      event,
      handler,
      pluginId: this.config.pluginId,
    });
  }

  /**
   * Unsubscribe from an engine event
   */
  off(event: string, handler: (payload: unknown) => void): void {
    this.eventHandlers = this.eventHandlers.filter(
      (h) => !(h.event === event && h.handler === handler)
    );
  }

  /**
   * Emit an event to the engine
   */
  emit(event: string, payload?: unknown): void {
    const relevantHandlers = this.eventHandlers.filter((h) => h.event === event);
    for (const h of relevantHandlers) {
      try {
        h.handler(payload);
      } catch {
        // isolate plugin errors
      }
    }
  }

  /**
   * Get all registered event handlers for a plugin
   */
  getEventHandlers(pluginId?: string): PluginEventHandler[] {
    if (pluginId) {
      return this.eventHandlers.filter((h) => h.pluginId === pluginId);
    }
    return [...this.eventHandlers];
  }

  // ===========================================================================
  // ASSET REGISTRATION
  // ===========================================================================

  /**
   * Register a plugin asset
   */
  registerAsset(asset: Omit<PluginAsset, 'pluginId'>): void {
    this.requirePermission('filesystem:read');

    const fullAsset: PluginAsset = {
      ...asset,
      pluginId: this.config.pluginId,
    };
    this.assets.set(asset.id, fullAsset);
  }

  /**
   * Unregister a plugin asset
   */
  unregisterAsset(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    if (asset && asset.pluginId === this.config.pluginId) {
      this.assets.delete(assetId);
      return true;
    }
    return false;
  }

  /**
   * Get a registered asset by ID
   */
  getAsset(assetId: string): PluginAsset | undefined {
    return this.assets.get(assetId);
  }

  /**
   * Get all assets registered by a plugin
   */
  getAssetsByPlugin(pluginId: string): PluginAsset[] {
    return [...this.assets.values()].filter((a) => a.pluginId === pluginId);
  }

  /**
   * Get total count of registered assets
   */
  getAssetCount(): number {
    return this.assets.size;
  }

  // ===========================================================================
  // COMMAND REGISTRATION
  // ===========================================================================

  /**
   * Register a command that can be called by the engine or other plugins
   */
  registerCommand(command: Omit<PluginCommand, 'pluginId'>): void {
    const fullCommand: PluginCommand = {
      ...command,
      pluginId: this.config.pluginId,
    };
    this.commands.set(command.id, fullCommand);
  }

  /**
   * Execute a registered command
   */
  executeCommand(commandId: string, ...args: unknown[]): unknown {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command "${commandId}" not found`);
    }
    return command.handler(...args);
  }

  /**
   * Get all registered commands
   */
  getCommands(): PluginCommand[] {
    return [...this.commands.values()];
  }

  // ===========================================================================
  // STATE STORE (per-plugin isolated state)
  // ===========================================================================

  /**
   * Set a value in the plugin's isolated state store
   */
  setState(key: string, value: unknown): void {
    const pluginId = this.config.pluginId;
    if (!this.stateStore.has(pluginId)) {
      this.stateStore.set(pluginId, new Map());
    }
    this.stateStore.get(pluginId)!.set(key, value);
  }

  /**
   * Get a value from the plugin's isolated state store
   */
  getState(key: string): unknown {
    return this.stateStore.get(this.config.pluginId)?.get(key);
  }

  /**
   * Get all state keys for the current plugin
   */
  getStateKeys(): string[] {
    const store = this.stateStore.get(this.config.pluginId);
    return store ? [...store.keys()] : [];
  }

  // ===========================================================================
  // SCENE ACCESS (permission-gated)
  // ===========================================================================

  /**
   * Query scene nodes (requires scene:read)
   */
  queryScene(filter: Record<string, unknown>): Record<string, unknown>[] {
    this.requirePermission('scene:read');
    // Mock implementation — would delegate to runtime
    return [{ type: 'node', filter, source: this.config.pluginId }];
  }

  /**
   * Modify a scene node (requires scene:write)
   */
  modifyNode(nodeId: string, properties: Record<string, unknown>): void {
    this.requirePermission('scene:write');
    this.emit('node:modify', { nodeId, properties, source: this.config.pluginId });
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Remove all registrations for the current plugin
   */
  cleanup(): void {
    const pluginId = this.config.pluginId;

    // Remove event handlers
    this.eventHandlers = this.eventHandlers.filter((h) => h.pluginId !== pluginId);

    // Remove assets
    for (const [id, asset] of this.assets) {
      if (asset.pluginId === pluginId) {
        this.assets.delete(id);
      }
    }

    // Remove commands
    for (const [id, command] of this.commands) {
      if (command.pluginId === pluginId) {
        this.commands.delete(id);
      }
    }

    // Remove state
    this.stateStore.delete(pluginId);
  }
}
