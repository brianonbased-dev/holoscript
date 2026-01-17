/**
 * Codebase Enhancements Tests
 *
 * Tests for EnhancedParser, AdvancedTypeSystem, RuntimeOptimization, DeveloperExperience, Interoperability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedParser, ErrorFormatter } from '../parser/EnhancedParser';
import { AdvancedTypeSystem, TypeInferenceEngine, ExhaustivenessChecker } from '../types/AdvancedTypeSystem';
import { ObjectPool, LazyEvaluator, LRUCache, PerformanceProfiler, BatchProcessor } from '../runtime/RuntimeOptimization';
import { HoloScriptREPL, ErrorFormatter as DevErrorFormatter, HotReloadWatcher, SourceMapGenerator } from '../tools/DeveloperExperience';
import { ModuleResolver, ExportImportHandler, AsyncFunctionHandler, ErrorBoundary, InteropContext } from '../interop/Interoperability';

describe('EnhancedParser', () => {
  let parser: EnhancedParser;

  beforeEach(() => {
    parser = new EnhancedParser();
  });

  describe('Error Recovery', () => {
    it('should recover from missing closing brace', () => {
      const code = `orb test { name: "unclosed"`;
      const result = parser.parse(code);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].recovery).toBeDefined();
    });

    it('should continue parsing after error', () => {
      const code = `
        orb test1 { name: "first" }
        INVALID SYNTAX
        orb test2 { name: "second" }
      `;
      const result = parser.parse(code);
      expect(result.ast.length).toBeGreaterThan(0);
    });

    it('should suggest fixes for common errors', () => {
      const code = `orb test { name "missing colon" }`;
      const result = parser.parse(code);
      if (result.errors.length > 0) {
        expect(result.errors[0].suggestion).toBeDefined();
      }
    });

    it('should track source location accurately', () => {
      const code = `line1\nline2\nERROR here`;
      const result = parser.parse(code);
      if (result.errors.length > 0) {
        expect(result.errors[0].location?.line).toBeGreaterThan(1);
      }
    });
  });

  describe('Error Formatting', () => {
    it('should format error with context', () => {
      const error = { message: 'Type mismatch', location: { line: 5, column: 10 } };
      const formatted = ErrorFormatter.formatError(error);
      expect(formatted).toContain('line 5');
      expect(formatted).toContain('column 10');
    });

    it('should show source line in error', () => {
      const sourceCode = 'let x: number = "string"';
      const error = { message: 'Type error', location: { line: 1, column: 20 } };
      const formatted = ErrorFormatter.formatError(error, sourceCode);
      expect(formatted).toContain('string');
    });

    it('should format multiple errors', () => {
      const errors = [
        { message: 'Error 1' },
        { message: 'Error 2' },
      ];
      const formatted = ErrorFormatter.formatErrors(errors);
      expect(formatted).toContain('2 errors');
    });
  });
});

describe('AdvancedTypeSystem', () => {
  let typeSystem: AdvancedTypeSystem;
  let inferenceEngine: TypeInferenceEngine;
  let exhaustivenessChecker: ExhaustivenessChecker;

  beforeEach(() => {
    typeSystem = new AdvancedTypeSystem();
    inferenceEngine = new TypeInferenceEngine();
    exhaustivenessChecker = new ExhaustivenessChecker();
  });

  describe('Type Inference', () => {
    it('should infer number type', () => {
      const type = inferenceEngine.inferType(42);
      expect(type.kind).toBe('primitive');
      expect(type.name).toBe('number');
    });

    it('should infer string type', () => {
      const type = inferenceEngine.inferType('text');
      expect(type.name).toBe('string');
    });

    it('should infer array element type', () => {
      const type = inferenceEngine.inferType([1, 2, 3]);
      expect(type.kind).toBe('array');
    });

    it('should infer object properties', () => {
      const type = inferenceEngine.inferType({ x: 1, y: 2 });
      expect(type.kind).toBe('object');
      expect(type.properties).toBeDefined();
    });

    it('should handle union types', () => {
      const values = ['text', 42];
      const type = inferenceEngine.inferType(values);
      expect(type.kind).toMatch(/union|array/);
    });
  });

  describe('Union Types', () => {
    it('should validate union member', () => {
      const unionType = typeSystem.createUnionType(['string', 'number']);
      const result = typeSystem.isTypeValid(unionType, 'text');
      expect(result).toBe(true);
    });

    it('should reject non-union member', () => {
      const unionType = typeSystem.createUnionType(['string', 'number']);
      const result = typeSystem.isTypeValid(unionType, true);
      expect(result).toBe(false);
    });

    it('should handle nullable types', () => {
      const unionType = typeSystem.createUnionType(['string', 'null']);
      expect(typeSystem.isTypeValid(unionType, null)).toBe(true);
      expect(typeSystem.isTypeValid(unionType, 'text')).toBe(true);
    });
  });

  describe('Generic Types', () => {
    it('should create generic array type', () => {
      const arrayType = typeSystem.createGenericType('Array', ['number']);
      expect(arrayType.kind).toBe('generic');
      expect(arrayType.name).toBe('Array');
    });

    it('should validate generic array', () => {
      const arrayType = typeSystem.createGenericType('Array', ['number']);
      const result = typeSystem.isTypeValid(arrayType, [1, 2, 3]);
      expect(result).toBe(true);
    });

    it('should handle nested generics', () => {
      const nestedType = typeSystem.createGenericType('Array', [
        typeSystem.createGenericType('Array', ['number']).toString(),
      ]);
      expect(nestedType).toBeDefined();
    });
  });

  describe('Exhaustiveness Checking', () => {
    it('should detect missing union member', () => {
      const unionType = 'string | number | boolean';
      const cases = ['string', 'number'];
      const result = exhaustivenessChecker.check(unionType, cases);
      expect(result.exhaustive).toBe(false);
      expect(result.missing).toContain('boolean');
    });

    it('should accept complete match', () => {
      const unionType = 'string | number | boolean';
      const cases = ['string', 'number', 'boolean'];
      const result = exhaustivenessChecker.check(unionType, cases);
      expect(result.exhaustive).toBe(true);
    });

    it('should handle default case', () => {
      const unionType = 'string | number';
      const cases = ['string', 'default'];
      const result = exhaustivenessChecker.check(unionType, cases);
      expect(result.exhaustive).toBe(true);
    });

    it('should validate literal types', () => {
      const unionType = '"idle" | "active" | "paused"';
      const cases = ['"idle"', '"active"', '"paused"'];
      const result = exhaustivenessChecker.check(unionType, cases);
      expect(result.exhaustive).toBe(true);
    });
  });
});

describe('RuntimeOptimization', () => {
  describe('ObjectPool', () => {
    it('should acquire object from pool', () => {
      const pool = new ObjectPool(
        () => ({ x: 0, y: 0, z: 0 }),
        (obj) => { obj.x = 0; obj.y = 0; obj.z = 0; }
      );

      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(pool.getStats().inUse).toBe(1);
    });

    it('should reuse released objects', () => {
      const pool = new ObjectPool(
        () => ({ value: 0 }),
        (obj) => { obj.value = 0; }
      );

      const obj1 = pool.acquire();
      obj1.value = 42;
      pool.release(obj1);

      const obj2 = pool.acquire();
      expect(obj2.value).toBe(0); // Reset
    });

    it('should track pool statistics', () => {
      const pool = new ObjectPool(
        () => ({}),
        () => {}
      );

      pool.acquire();
      pool.acquire();
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.inUse).toBe(3);
      expect(stats.available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('LazyEvaluator', () => {
    it('should defer computation', () => {
      let computations = 0;
      const lazy = new LazyEvaluator(() => {
        computations++;
        return 42;
      });

      expect(computations).toBe(0);
      const result = lazy.value;
      expect(computations).toBe(1);
      expect(result).toBe(42);
    });

    it('should cache computed value', () => {
      let computations = 0;
      const lazy = new LazyEvaluator(() => {
        computations++;
        return 'result';
      });

      const val1 = lazy.value;
      const val2 = lazy.value;
      expect(computations).toBe(1);
      expect(val1).toBe(val2);
    });
  });

  describe('LRUCache', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should evict least recently used', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // 'a' should be evicted

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should update entry on access', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // 'a' becomes more recent
      cache.set('c', 3); // 'b' should be evicted

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
    });

    it('should provide statistics', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.get('a');
      cache.get('missing');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('PerformanceProfiler', () => {
    it('should measure function execution time', async () => {
      const profiler = new PerformanceProfiler();

      profiler.start('test');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = profiler.end('test');

      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should track hot paths', () => {
      const profiler = new PerformanceProfiler();

      for (let i = 0; i < 100; i++) {
        profiler.start('loop');
        profiler.end('loop');
      }

      const report = profiler.getReport();
      expect(report.hotPaths.length).toBeGreaterThan(0);
    });

    it('should identify performance bottlenecks', () => {
      const profiler = new PerformanceProfiler();

      profiler.start('slow');
      // Simulate slow operation
      const arr = [];
      for (let i = 0; i < 10000; i++) {
        arr.push(i);
      }
      profiler.end('slow');

      const report = profiler.getReport();
      expect(report.bottlenecks).toBeDefined();
    });
  });

  describe('BatchProcessor', () => {
    it('should batch multiple operations', async () => {
      const processor = new BatchProcessor<number>(async (items) => {
        return items.map((x) => x * 2);
      }, 10);

      const results: number[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await processor.add(i);
        results.push(result);
      }

      expect(results.length).toBe(5);
    });

    it('should flush on batch size', async () => {
      let flushCount = 0;
      const processor = new BatchProcessor<string>(async (items) => {
        flushCount++;
        return items;
      }, 2);

      await processor.add('a');
      await processor.add('b');
      await processor.add('c');

      expect(flushCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('DeveloperExperience', () => {
  describe('Error Formatter', () => {
    it('should format error with location', () => {
      const error = { message: 'Test error', location: { line: 1, column: 5 } };
      const formatted = DevErrorFormatter.formatError(error);
      expect(formatted).toContain('Error');
      expect(formatted).toContain('line 1');
    });

    it('should format success message', () => {
      const formatted = DevErrorFormatter.formatSuccess('Operation completed');
      expect(formatted).toContain('✅');
      expect(formatted).toContain('Operation completed');
    });

    it('should provide help text', () => {
      const help = DevErrorFormatter.formatHelp();
      expect(help).toContain('REPL');
      expect(help).toContain('help');
    });
  });

  describe('SourceMapGenerator', () => {
    it('should generate source map', () => {
      const generator = new SourceMapGenerator();
      generator.addMapping(1, 0, 1, 0, 'variable');

      const map = generator.generate('source.hs', 'generated.js');
      expect(map.version).toBe(3);
      expect(map.sources).toContain('source.hs');
    });

    it('should track line mappings', () => {
      const generator = new SourceMapGenerator();
      generator.addMapping(1, 0, 1, 0);
      generator.addMapping(2, 0, 2, 0);

      const map = generator.generate('src.hs', 'dist.js');
      expect(map.mappings).toBeDefined();
    });
  });
});

describe('Interoperability', () => {
  describe('ModuleResolver', () => {
    it('should resolve relative imports', () => {
      const resolver = new ModuleResolver();
      const resolved = resolver.resolveModule('./utils', '/project/src/index.ts');
      expect(resolved).toContain('utils');
    });

    it('should resolve node modules', () => {
      const resolver = new ModuleResolver();
      const resolved = resolver.resolveModule('@holoscript/core');
      expect(resolved).toBeDefined();
    });

    it('should handle built-in modules', () => {
      const resolver = new ModuleResolver();
      const resolved = resolver.resolveModule('fs');
      expect(resolved).toBe('fs');
    });
  });

  describe('ExportImportHandler', () => {
    it('should define named export', () => {
      const handler = new ExportImportHandler();
      handler.defineExport('module.ts', 'helper', () => {});

      const exported = handler.getExport('module.ts', 'helper');
      expect(exported).toBeDefined();
    });

    it('should get all module exports', () => {
      const handler = new ExportImportHandler();
      handler.defineExport('module.ts', 'fn1', () => {});
      handler.defineExport('module.ts', 'fn2', () => {});

      const exports = handler.getAllExports('module.ts');
      expect(Object.keys(exports).length).toBe(2);
    });
  });

  describe('AsyncFunctionHandler', () => {
    it('should detect async functions', () => {
      const handler = new AsyncFunctionHandler();
      const async_fn = async () => {};
      const sync_fn = () => {};

      expect(handler.isAsync(async_fn)).toBe(true);
      expect(handler.isAsync(sync_fn)).toBe(false);
    });

    it('should wrap async functions', async () => {
      const handler = new AsyncFunctionHandler();
      const original = async (x: number) => x * 2;

      const wrapped = handler.wrapAsyncFunction(original);
      const result = await wrapped(5);
      expect(result).toBe(10);
    });
  });

  describe('ErrorBoundary', () => {
    it('should catch synchronous errors', () => {
      const boundary = new ErrorBoundary();
      const wrapped = boundary.wrap(() => {
        throw new Error('Test error');
      });

      expect(() => wrapped()).toThrow();
      expect(boundary.getErrors().length).toBeGreaterThan(0);
    });

    it('should catch async errors', async () => {
      const boundary = new ErrorBoundary();
      const wrapped = boundary.wrapAsync(async () => {
        throw new Error('Async error');
      });

      await expect(wrapped()).rejects.toThrow();
      expect(boundary.getErrors().length).toBeGreaterThan(0);
    });
  });

  describe('InteropContext', () => {
    it('should provide unified context', () => {
      const context = new InteropContext();

      expect(context.getModuleResolver()).toBeDefined();
      expect(context.getExportImportHandler()).toBeDefined();
      expect(context.getAsyncHandler()).toBeDefined();
      expect(context.getErrorBoundary()).toBeDefined();
    });
  });
});
