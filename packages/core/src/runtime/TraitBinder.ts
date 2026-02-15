/**
 * TraitBinder.ts
 *
 * Maps trait names from parsed AST directives to runtime TraitHandler instances.
 * This is the registry that connects "@grabbable", "@audio", "@particles", etc.
 * to their actual runtime implementations.
 */

import type { TraitHandler } from '../traits/TraitTypes';

export class TraitBinder {
    private handlers: Map<string, TraitHandler<any>> = new Map();

    /**
     * Register a trait handler by name.
     */
    register(name: string, handler: TraitHandler<any>): void {
        this.handlers.set(name, handler);
    }

    /**
     * Register multiple handlers at once.
     */
    registerAll(entries: Array<[string, TraitHandler<any>]>): void {
        for (const [name, handler] of entries) {
            this.handlers.set(name, handler);
        }
    }

    /**
     * Resolve a trait name to a handler.
     */
    resolve(name: string): TraitHandler<any> | undefined {
        return this.handlers.get(name);
    }

    /**
     * Check if a trait is registered.
     */
    has(name: string): boolean {
        return this.handlers.has(name);
    }

    /**
     * Get all registered trait names.
     */
    listTraits(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * Get count of registered handlers.
     */
    get count(): number {
        return this.handlers.size;
    }

    /**
     * Merge config from directive with handler defaults.
     */
    mergeConfig(name: string, directiveConfig: Record<string, any>): any {
        const handler = this.handlers.get(name);
        if (!handler) return directiveConfig;
        return { ...handler.defaultConfig, ...directiveConfig };
    }
}
