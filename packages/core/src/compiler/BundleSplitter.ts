import type { ASTProgram, HSPlusNode, ImportNode } from '../types';

export interface BundleChunk {
  id: string;
  files: string[];
  entryPoint?: string;
  isDynamic: boolean;
  parentChunkId?: string;
  size?: number;
}

export interface SplitPoint {
  nodeId: string;
  line: number;
  sourceFile: string;
  targetModule: string;
  type: 'dynamic_import' | 'conditional_branch' | 'route';
}

/**
 * Analyzes AST to identify potential bundle split points.
 */
export class BundleSplitter {
  private chunks: Map<string, BundleChunk> = new Map();
  private splitPoints: SplitPoint[] = [];

  constructor() {
    // specific config if needed
  }

  /**
   * Analyze the program AST to find dynamic imports and split points.
   */
  public analyze(ast: ASTProgram): SplitPoint[] {
    this.splitPoints = [];
    this.traverse(ast.root);
    return this.splitPoints;
  }

  private traverse(node: HSPlusNode) {
    // 1. Check for dynamic imports in `logic` blocks
    if (node.type === 'logic' && (node as any).body) {
      const body = (node as any).body;
      
      // Functions
      if (body.functions) {
         for (const func of body.functions) {
           if (func.body) this.scanStringForImports(func.body, `func_${func.name}`);
         }
      }

      // Event Handlers
      if (body.eventHandlers) {
         for (const handler of body.eventHandlers) {
           if (handler.body) this.scanStringForImports(handler.body, `event_${handler.event}`);
         }
      }
      
      // Tick Handlers
      if (body.tickHandlers) {
        for (const handler of body.tickHandlers) {
           if (handler.body) this.scanStringForImports(handler.body, `tick_${handler.interval}`);
        }
      }
    }

    // 3. Fallback: Check for CallExpression nodes if parser supports them
    if (this.isDynamicImport(node)) {
        const target = this.extractImportPath(node);
        if (target) {
            this.splitPoints.push({
                nodeId: node.id || 'unknown',
                line: node.loc?.start.line || 0,
                sourceFile: 'unknown',
                targetModule: target,
                type: 'dynamic_import'
            });
        }
    }

    if (node.children) {
      for (const child of node.children) {
        this.traverse(child);
      }
    }
  }

  private scanStringForImports(code: string, contextId: string) {
    // Regex matches import(...) with or without quotes
    // Matches: import("mod"), import('mod'), import(mod), import ( mod )
    const importRegex = /import\s*\(\s*(?:['"]?)([^)'"]+)(?:['"]?)\s*\)/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      let target = match[1].trim();
      this.splitPoints.push({
        nodeId: contextId,
        line: 0,
        sourceFile: 'unknown',
        targetModule: target,
        type: 'dynamic_import'
      });
    }
  }

  private isDynamicImport(node: HSPlusNode): boolean {
    // This logic depends on how the parser represents dynamic imports.
    // Often it's a CallExpression with callee.name === 'import'
    // Or a specific node type.
    if (node.type === 'call_expression' && (node as any).callee === 'import') {
        return true;
    }
    // As per HoloScript AST, checking if we have a specific node for this
    return false; 
  }

  private extractImportPath(node: HSPlusNode): string | null {
      // placeholder extraction
      if ((node as any).arguments?.[0]) {
          return (node as any).arguments[0];
      }
      return null;
  }
  
  /**
   * Generates a manifest of chunks based on identified split points.
   */
  public generateManifest(): BundleChunk[] {
    // Create main chunk for non-dynamic code
    const mainChunk: BundleChunk = {
      id: 'main',
      files: [],
      entryPoint: 'index.holo',
      isDynamic: false,
    };
    this.chunks.set('main', mainChunk);
    
    // Group split points by target module to create dynamic chunks
    const moduleToSplitPoints = new Map<string, SplitPoint[]>();
    
    for (const sp of this.splitPoints) {
      const existing = moduleToSplitPoints.get(sp.targetModule);
      if (existing) {
        existing.push(sp);
      } else {
        moduleToSplitPoints.set(sp.targetModule, [sp]);
      }
    }
    
    // Create a chunk for each unique dynamically imported module
    let chunkIndex = 0;
    for (const [modulePath, points] of moduleToSplitPoints) {
      const chunkId = `chunk_${chunkIndex++}`;
      const chunk: BundleChunk = {
        id: chunkId,
        files: [modulePath],
        isDynamic: true,
        parentChunkId: 'main',
        size: 0, // Would be calculated during actual bundling
      };
      this.chunks.set(chunkId, chunk);
      
      // Track which files reference this chunk
      for (const sp of points) {
        if (sp.sourceFile && sp.sourceFile !== 'unknown') {
          // Add source file to main chunk if not already tracked
          if (!mainChunk.files.includes(sp.sourceFile)) {
            mainChunk.files.push(sp.sourceFile);
          }
        }
      }
    }
    
    return Array.from(this.chunks.values());
  }
  
  /**
   * Get split points (for debugging/analysis)
   */
  public getSplitPoints(): SplitPoint[] {
    return this.splitPoints;
  }
  
  /**
   * Clear all chunks and split points (for reanalysis)
   */
  public clear(): void {
    this.chunks.clear();
    this.splitPoints = [];
  }}