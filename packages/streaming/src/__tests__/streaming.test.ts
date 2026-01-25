/**
 * @holoscript/streaming - Test Suite
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch for testing
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock IndexedDB
const mockIDB = {
  databases: vi.fn().mockResolvedValue([]),
  deleteDatabase: vi.fn(),
  open: vi.fn().mockReturnValue({
    result: {},
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  }),
};
vi.stubGlobal('indexedDB', mockIDB);

import {
  StreamingManager,
  createStreamingManager,
  AssetLoader,
  CacheManager,
  LODManager,
  ProgressiveLoader,
  PRIORITY_LEVELS,
  CACHE_STRATEGIES,
} from '../src/index.js';
import type { StreamingConfig, AssetPriority, CacheStrategy } from '../src/types.js';

describe('@holoscript/streaming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createStreamingManager', () => {
    it('should create a manager with default settings', () => {
      const manager = createStreamingManager();
      expect(manager).toBeInstanceOf(StreamingManager);
    });

    it('should create a manager with custom settings', () => {
      const config: Partial<StreamingConfig> = {
        maxConcurrentLoads: 8,
        cacheSize: 200 * 1024 * 1024, // 200MB
        cacheStrategy: 'lru',
        enableCompression: true,
        retryAttempts: 5,
      };
      
      const manager = createStreamingManager(config);
      expect(manager).toBeInstanceOf(StreamingManager);
    });
  });

  describe('PRIORITY_LEVELS', () => {
    it('should have standard priority levels', () => {
      expect(PRIORITY_LEVELS.critical).toBeDefined();
      expect(PRIORITY_LEVELS.high).toBeDefined();
      expect(PRIORITY_LEVELS.normal).toBeDefined();
      expect(PRIORITY_LEVELS.low).toBeDefined();
      expect(PRIORITY_LEVELS.background).toBeDefined();
    });

    it('should have correct ordering', () => {
      expect(PRIORITY_LEVELS.critical).toBeGreaterThan(PRIORITY_LEVELS.high);
      expect(PRIORITY_LEVELS.high).toBeGreaterThan(PRIORITY_LEVELS.normal);
      expect(PRIORITY_LEVELS.normal).toBeGreaterThan(PRIORITY_LEVELS.low);
      expect(PRIORITY_LEVELS.low).toBeGreaterThan(PRIORITY_LEVELS.background);
    });
  });

  describe('CACHE_STRATEGIES', () => {
    it('should have standard cache strategies', () => {
      expect(CACHE_STRATEGIES.lru).toBeDefined();
      expect(CACHE_STRATEGIES.lfu).toBeDefined();
      expect(CACHE_STRATEGIES.fifo).toBeDefined();
    });
  });

  describe('AssetLoader', () => {
    let loader: AssetLoader;

    beforeEach(() => {
      loader = new AssetLoader();
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        headers: new Headers({ 'content-length': '100' }),
      });
    });

    it('should load assets', async () => {
      const result = await loader.load('https://example.com/model.glb');
      expect(result).toBeDefined();
    });

    it('should track loading progress', async () => {
      const onProgress = vi.fn();
      
      await loader.load('https://example.com/model.glb', {
        onProgress,
      });
      
      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle load errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.load('https://example.com/missing.glb'))
        .rejects.toThrow();
    });

    it('should retry on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
          headers: new Headers({ 'content-length': '100' }),
        });

      const result = await loader.load('https://example.com/model.glb', {
        retries: 3,
      });
      
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('CacheManager', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = new CacheManager({
        maxSize: 1024 * 1024, // 1MB
        strategy: 'lru',
      });
    });

    it('should store and retrieve items', async () => {
      const data = new ArrayBuffer(100);
      await cache.set('key1', data);
      
      const retrieved = await cache.get('key1');
      expect(retrieved).toEqual(data);
    });

    it('should check if items exist', async () => {
      const data = new ArrayBuffer(100);
      await cache.set('key1', data);
      
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(false);
    });

    it('should delete items', async () => {
      const data = new ArrayBuffer(100);
      await cache.set('key1', data);
      await cache.delete('key1');
      
      expect(await cache.has('key1')).toBe(false);
    });

    it('should clear all items', async () => {
      await cache.set('key1', new ArrayBuffer(100));
      await cache.set('key2', new ArrayBuffer(100));
      await cache.clear();
      
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });

    it('should evict items when full (LRU)', async () => {
      const cache = new CacheManager({
        maxSize: 200, // Very small
        strategy: 'lru',
      });
      
      await cache.set('key1', new ArrayBuffer(100));
      await cache.set('key2', new ArrayBuffer(100));
      
      // Access key1 to make it recently used
      await cache.get('key1');
      
      // This should evict key2 (least recently used)
      await cache.set('key3', new ArrayBuffer(100));
      
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(false);
      expect(await cache.has('key3')).toBe(true);
    });
  });

  describe('LODManager', () => {
    let lod: LODManager;

    beforeEach(() => {
      lod = new LODManager();
    });

    it('should register LOD levels', () => {
      lod.registerLOD('model', [
        { level: 0, url: 'model_high.glb', distance: 0 },
        { level: 1, url: 'model_medium.glb', distance: 10 },
        { level: 2, url: 'model_low.glb', distance: 50 },
      ]);
      
      expect(lod.getLODCount('model')).toBe(3);
    });

    it('should select appropriate LOD based on distance', () => {
      lod.registerLOD('model', [
        { level: 0, url: 'model_high.glb', distance: 0 },
        { level: 1, url: 'model_medium.glb', distance: 10 },
        { level: 2, url: 'model_low.glb', distance: 50 },
      ]);
      
      expect(lod.selectLOD('model', 5)).toBe(0);
      expect(lod.selectLOD('model', 15)).toBe(1);
      expect(lod.selectLOD('model', 100)).toBe(2);
    });

    it('should get LOD URL', () => {
      lod.registerLOD('model', [
        { level: 0, url: 'model_high.glb', distance: 0 },
        { level: 1, url: 'model_medium.glb', distance: 10 },
      ]);
      
      expect(lod.getLODUrl('model', 0)).toBe('model_high.glb');
      expect(lod.getLODUrl('model', 1)).toBe('model_medium.glb');
    });
  });

  describe('ProgressiveLoader', () => {
    let loader: ProgressiveLoader;

    beforeEach(() => {
      loader = new ProgressiveLoader();
    });

    it('should load progressively', async () => {
      const stages: number[] = [];
      
      await loader.loadProgressive('model.glb', {
        onStageComplete: (stage) => stages.push(stage),
      });
      
      expect(stages.length).toBeGreaterThan(0);
    });

    it('should support cancellation', async () => {
      const controller = new AbortController();
      
      const promise = loader.loadProgressive('large-model.glb', {
        signal: controller.signal,
      });
      
      controller.abort();
      
      await expect(promise).rejects.toThrow('Aborted');
    });
  });

  describe('StreamingManager', () => {
    let manager: StreamingManager;

    beforeEach(() => {
      manager = createStreamingManager({
        maxConcurrentLoads: 4,
        cacheSize: 100 * 1024 * 1024,
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        headers: new Headers({ 'content-length': '100' }),
      });
    });

    it('should queue and process loads', async () => {
      const result = await manager.load('model.glb', { priority: 'normal' });
      expect(result).toBeDefined();
    });

    it('should respect priority ordering', async () => {
      const order: string[] = [];
      
      // Queue multiple loads with different priorities
      manager.load('low.glb', { 
        priority: 'low',
        onComplete: () => order.push('low'),
      });
      
      manager.load('high.glb', { 
        priority: 'high',
        onComplete: () => order.push('high'),
      });
      
      manager.load('critical.glb', { 
        priority: 'critical',
        onComplete: () => order.push('critical'),
      });
      
      await manager.flush();
      
      // Higher priority should complete first
      expect(order[0]).toBe('critical');
      expect(order[1]).toBe('high');
      expect(order[2]).toBe('low');
    });

    it('should return cached results', async () => {
      // First load
      await manager.load('model.glb');
      
      mockFetch.mockClear();
      
      // Second load should use cache
      await manager.load('model.glb');
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should preload assets', async () => {
      await manager.preload(['model1.glb', 'model2.glb', 'model3.glb']);
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should get loading statistics', () => {
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('cacheHits');
      expect(stats).toHaveProperty('cacheMisses');
      expect(stats).toHaveProperty('bytesLoaded');
    });
  });
});
