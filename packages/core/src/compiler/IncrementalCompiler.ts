/**
 * IncrementalCompiler - Hot reload and incremental compilation support
 *
 * Features:
 * - AST diffing to detect changes
 * - Selective recompilation of changed nodes
 * - State preservation during reload
 * - Dependency tracking between objects
 */

import type { HoloComposition, HoloObjectDecl, HoloObjectProperty } from '../parser/HoloCompositionTypes';

/**
 * Types of changes detected during AST diff
 */
export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Represents a single change in the AST
 */
export interface ASTChange {
  type: ChangeType;
  path: string[];
  nodeName: string;
  nodeType: 'object' | 'property' | 'trait' | 'logic' | 'composition';
  oldValue?: any;
  newValue?: any;
}

/**
 * Result of diffing two ASTs
 */
export interface DiffResult {
  hasChanges: boolean;
  changes: ASTChange[];
  addedObjects: string[];
  removedObjects: string[];
  modifiedObjects: string[];
  unchangedObjects: string[];
}

/**
 * Compilation cache entry
 */
export interface CacheEntry {
  hash: string;
  compiledCode: string;
  dependencies: string[];
  timestamp: number;
}

/**
 * State snapshot for hot reload
 */
export interface StateSnapshot {
  objectStates: Map<string, Record<string, unknown>>;
  timestamp: number;
}

/**
 * Options for incremental compilation
 */
export interface IncrementalCompileOptions {
  preserveState?: boolean;
  forceRecompile?: string[];
  skipUnchanged?: boolean;
}

/**
 * Incremental compilation result
 */
export interface IncrementalCompileResult {
  fullRecompile: boolean;
  recompiledObjects: string[];
  cachedObjects: string[];
  statePreserved: boolean;
  compiledCode: string;
  changes: DiffResult;
}

/**
 * Simple hash function for content comparison
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Serialize a HoloObjectDecl for comparison
 */
function serializeObject(obj: HoloObjectDecl): string {
  return JSON.stringify({
    name: obj.name,
    properties: obj.properties,
    traits: obj.traits,
    children: obj.children?.map(serializeObject),
    logic: (obj as any).logic, // logic might not be directly on HoloObjectDecl but used in diff
  });
}

/**
 * Serialize a property value for comparison
 */
function serializeProperty(prop: HoloObjectProperty): string {
  return JSON.stringify({ key: prop.key, value: prop.value });
}

/**
 * IncrementalCompiler class for hot reload support
 */
export class IncrementalCompiler {
  private cache: Map<string, CacheEntry> = new Map();
  private previousAST: HoloComposition | null = null;
  private stateSnapshot: StateSnapshot | null = null;
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor() {}

  /**
   * Diff two ASTs and return the changes
   */
  diff(oldAST: HoloComposition | null, newAST: HoloComposition): DiffResult {
    const changes: ASTChange[] = [];
    const addedObjects: string[] = [];
    const removedObjects: string[] = [];
    const modifiedObjects: string[] = [];
    const unchangedObjects: string[] = [];

    if (!oldAST) {
      // First compile - everything is new
      const allObjects = this.collectObjectNames(newAST);
      return {
        hasChanges: true,
        changes: allObjects.map(name => ({
          type: 'added' as ChangeType,
          path: [name],
          nodeName: name,
          nodeType: 'object' as const,
          newValue: this.findObject(newAST, name),
        })),
        addedObjects: allObjects,
        removedObjects: [],
        modifiedObjects: [],
        unchangedObjects: [],
      };
    }

    const oldObjects = new Map<string, HoloObjectDecl>();
    const newObjects = new Map<string, HoloObjectDecl>();

    // Build maps of objects by name
    this.collectObjects(oldAST, oldObjects);
    this.collectObjects(newAST, newObjects);

    // Find added objects
    for (const [name, obj] of newObjects) {
      if (!oldObjects.has(name)) {
        addedObjects.push(name);
        changes.push({
          type: 'added',
          path: [name],
          nodeName: name,
          nodeType: 'object',
          newValue: obj,
        });
      }
    }

    // Find removed objects
    for (const [name, obj] of oldObjects) {
      if (!newObjects.has(name)) {
        removedObjects.push(name);
        changes.push({
          type: 'removed',
          path: [name],
          nodeName: name,
          nodeType: 'object',
          oldValue: obj,
        });
      }
    }

    // Find modified and unchanged objects
    for (const [name, newObj] of newObjects) {
      if (oldObjects.has(name)) {
        const oldObj = oldObjects.get(name)!;
        const objectChanges = this.diffObject(oldObj, newObj, [name]);

        if (objectChanges.length > 0) {
          modifiedObjects.push(name);
          changes.push(...objectChanges);
        } else {
          unchangedObjects.push(name);
        }
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      addedObjects,
      removedObjects,
      modifiedObjects,
      unchangedObjects,
    };
  }

  /**
   * Diff two objects and return property-level changes
   */
  private diffObject(oldObj: HoloObjectDecl, newObj: HoloObjectDecl, path: string[]): ASTChange[] {
    const changes: ASTChange[] = [];

    // Compare properties
    const oldProps = new Map(oldObj.properties?.map(p => [p.key, p]) || []);
    const newProps = new Map(newObj.properties?.map(p => [p.key, p]) || []);

    for (const [key, newProp] of newProps) {
      if (!oldProps.has(key)) {
        changes.push({
          type: 'added',
          path: [...path, key],
          nodeName: key,
          nodeType: 'property',
          newValue: newProp.value,
        });
      } else {
        const oldProp = oldProps.get(key)!;
        if (serializeProperty(oldProp) !== serializeProperty(newProp)) {
          changes.push({
            type: 'modified',
            path: [...path, key],
            nodeName: key,
            nodeType: 'property',
            oldValue: oldProp.value,
            newValue: newProp.value,
          });
        }
      }
    }

    for (const key of oldProps.keys()) {
      if (!newProps.has(key)) {
        changes.push({
          type: 'removed',
          path: [...path, key],
          nodeName: key,
          nodeType: 'property',
          oldValue: oldProps.get(key)!.value,
        });
      }
    }

    // Compare traits (handle both string arrays and trait objects with .name property)
    const oldTraits = new Set((oldObj.traits || []).map(t => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && 'name' in t) return (t as any).name;
      return String(t);
    }));
    const newTraits = new Set((newObj.traits || []).map(t => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && 'name' in t) return (t as any).name;
      return String(t);
    }));

    for (const trait of newTraits) {
      if (!oldTraits.has(trait)) {
        changes.push({
          type: 'added',
          path: [...path, '@' + trait],
          nodeName: trait,
          nodeType: 'trait',
          newValue: trait,
        });
      }
    }

    for (const trait of oldTraits) {
      if (!newTraits.has(trait)) {
        changes.push({
          type: 'removed',
          path: [...path, '@' + trait],
          nodeName: trait,
          nodeType: 'trait',
          oldValue: trait,
        });
      }
    }

    // Compare logic blocks
    if (JSON.stringify((oldObj as any).logic) !== JSON.stringify((newObj as any).logic)) {
      changes.push({
        type: 'modified',
        path: [...path, 'logic'],
        nodeName: 'logic',
        nodeType: 'logic',
        oldValue: (oldObj as any).logic,
        newValue: (newObj as any).logic,
      });
    }

    // Compare children recursively
    const oldChildren = new Map((oldObj.children || []).map(c => [c.name, c]));
    const newChildren = new Map((newObj.children || []).map(c => [c.name, c]));

    for (const [name, newChild] of newChildren) {
      if (!oldChildren.has(name)) {
        changes.push({
          type: 'added',
          path: [...path, name],
          nodeName: name,
          nodeType: 'object',
          newValue: newChild,
        });
      } else {
        const childChanges = this.diffObject(oldChildren.get(name)!, newChild, [...path, name]);
        changes.push(...childChanges);
      }
    }

    for (const name of oldChildren.keys()) {
      if (!newChildren.has(name)) {
        changes.push({
          type: 'removed',
          path: [...path, name],
          nodeName: name,
          nodeType: 'object',
          oldValue: oldChildren.get(name),
        });
      }
    }

    return changes;
  }

  /**
   * Collect all object names from a composition
   */
  private collectObjectNames(composition: HoloComposition): string[] {
    const names: string[] = [];

    const collectFromObject = (obj: HoloObjectDecl) => {
      names.push(obj.name);
      obj.children?.forEach(collectFromObject);
    };

    composition.objects?.forEach(collectFromObject);
    composition.spatialGroups?.forEach(group => {
      names.push(group.name);
      group.objects?.forEach(collectFromObject);
    });

    return names;
  }

  /**
   * Collect all objects into a map
   */
  private collectObjects(composition: HoloComposition, map: Map<string, HoloObjectDecl>): void {
    const collectFromObject = (obj: HoloObjectDecl) => {
      map.set(obj.name, obj);
      obj.children?.forEach(collectFromObject);
    };

    composition.objects?.forEach(collectFromObject);
    composition.spatialGroups?.forEach(group => {
      group.objects?.forEach(collectFromObject);
    });
  }

  /**
   * Find an object by name in a composition
   */
  private findObject(composition: HoloComposition, name: string): HoloObjectDecl | undefined {
    const searchInObject = (obj: HoloObjectDecl): HoloObjectDecl | undefined => {
      if (obj.name === name) return obj;
      for (const child of obj.children || []) {
        const found = searchInObject(child);
        if (found) return found;
      }
      return undefined;
    };

    for (const obj of composition.objects || []) {
      const found = searchInObject(obj);
      if (found) return found;
    }

    for (const group of composition.spatialGroups || []) {
      for (const obj of group.objects || []) {
        const found = searchInObject(obj);
        if (found) return found;
      }
    }

    return undefined;
  }

  /**
   * Get cached compilation for an object if still valid
   */
  getCached(objectName: string, currentHash: string): CacheEntry | null {
    const entry = this.cache.get(objectName);
    if (entry && entry.hash === currentHash) {
      return entry;
    }
    return null;
  }

  /**
   * Store compilation result in cache
   */
  setCached(objectName: string, hash: string, compiledCode: string, dependencies: string[]): void {
    this.cache.set(objectName, {
      hash,
      compiledCode,
      dependencies,
      timestamp: Date.now(),
    });
  }

  /**
   * Save current state for hot reload
   */
  saveState(states: Map<string, Record<string, unknown>>): void {
    this.stateSnapshot = {
      objectStates: new Map(states),
      timestamp: Date.now(),
    };
  }

  /**
   * Restore state after hot reload
   */
  restoreState(): StateSnapshot | null {
    return this.stateSnapshot;
  }

  /**
   * Clear state snapshot
   */
  clearState(): void {
    this.stateSnapshot = null;
  }

  /**
   * Update dependency graph
   */
  updateDependencies(objectName: string, dependencies: string[]): void {
    this.dependencyGraph.set(objectName, new Set(dependencies));
  }

  /**
   * Get objects that depend on a given object
   */
  getDependents(objectName: string): string[] {
    const dependents: string[] = [];
    for (const [name, deps] of this.dependencyGraph) {
      if (deps.has(objectName)) {
        dependents.push(name);
      }
    }
    return dependents;
  }

  /**
   * Get all objects that need recompilation due to a change
   */
  getRecompilationSet(changedObjects: string[]): Set<string> {
    const toRecompile = new Set<string>(changedObjects);

    // Add all dependents transitively
    const queue = [...changedObjects];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.getDependents(current);
      for (const dep of dependents) {
        if (!toRecompile.has(dep)) {
          toRecompile.add(dep);
          queue.push(dep);
        }
      }
    }

    return toRecompile;
  }

  /**
   * Perform incremental compilation
   */
  compile(
    newAST: HoloComposition,
    compileObject: (obj: HoloObjectDecl) => string,
    options: IncrementalCompileOptions = {}
  ): IncrementalCompileResult {
    const { preserveState = true, forceRecompile = [], skipUnchanged = true } = options;

    // Diff with previous AST
    const diffResult = this.diff(this.previousAST, newAST);

    // Determine what needs recompilation
    const changedObjects = [
      ...diffResult.addedObjects,
      ...diffResult.modifiedObjects,
      ...forceRecompile,
    ];
    const recompileSet = this.getRecompilationSet(changedObjects);

    // Also need to recompile objects with removed dependencies
    for (const removed of diffResult.removedObjects) {
      const dependents = this.getDependents(removed);
      for (const dep of dependents) {
        recompileSet.add(dep);
      }
    }

    const recompiledObjects: string[] = [];
    const cachedObjects: string[] = [];
    const compiledParts: string[] = [];

    // Compile each object
    const allObjects = new Map<string, HoloObjectDecl>();
    this.collectObjects(newAST, allObjects);

    for (const [name, obj] of allObjects) {
      const hash = hashContent(serializeObject(obj));

      if (skipUnchanged && !recompileSet.has(name)) {
        const cached = this.getCached(name, hash);
        if (cached) {
          cachedObjects.push(name);
          compiledParts.push(cached.compiledCode);
          continue;
        }
      }

      // Compile the object
      const compiled = compileObject(obj);
      recompiledObjects.push(name);
      compiledParts.push(compiled);

      // Update cache
      this.setCached(name, hash, compiled, []);
    }

    // Update previous AST
    this.previousAST = newAST;

    return {
      fullRecompile: cachedObjects.length === 0,
      recompiledObjects,
      cachedObjects,
      statePreserved: preserveState && this.stateSnapshot !== null,
      compiledCode: compiledParts.join('\n\n'),
      changes: diffResult,
    };
  }

  /**
   * Reset compiler state
   */
  reset(): void {
    this.cache.clear();
    this.previousAST = null;
    this.stateSnapshot = null;
    this.dependencyGraph.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    objectsCached: string[];
    dependencyEdges: number;
  } {
    let dependencyEdges = 0;
    for (const deps of this.dependencyGraph.values()) {
      dependencyEdges += deps.size;
    }

    return {
      cacheSize: this.cache.size,
      objectsCached: Array.from(this.cache.keys()),
      dependencyEdges,
    };
  }
}

/**
 * Factory function
 */
export function createIncrementalCompiler(): IncrementalCompiler {
  return new IncrementalCompiler();
}
