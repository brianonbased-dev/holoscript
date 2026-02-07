import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HoloScriptPlusRuntimeImpl as HoloScriptPlusRuntime } from '../HoloScriptPlusRuntime';
import { ChunkLoader } from '../loader';

// Mock global fetch
global.fetch = vi.fn();

describe('Chunk Loading Integration', () => {
  let runtime: HoloScriptPlusRuntime;
  const mockManifest = {
    version: '1.0.0',
    chunks: {
      'zone-a': {
        file: 'zone-a.chunk.json',
        bounds: [
          [0, 0, 0],
          [10, 10, 10],
        ],
      },
    },
  };

  const mockChunk = {
    id: 'zone-a',
    objects: [
      {
        name: 'loaded_object',
        type: 'orb',
        properties: [{ key: 'position', value: [5, 5, 5] }],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes chunk loader when manifestUrl is provided', () => {
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve(mockManifest),
    });

    runtime = new HoloScriptPlusRuntime(
      {
        root: { type: 'composition', children: [] },
      } as any,
      {
        manifestUrl: 'http://test/manifest.json',
      }
    );

    expect(global.fetch).toHaveBeenCalledWith('http://test/manifest.json');
  });

  it('does NOT initialize chunk loader when manifestUrl is missing', () => {
    runtime = new HoloScriptPlusRuntime(
      {
        root: { type: 'composition', children: [] },
      } as any,
      {}
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads chunk when player enters bounds', async () => {
    // Setup fetch mocks
    (global.fetch as any)
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockManifest) }) // Manifest
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockChunk) }); // Chunk

    runtime = new HoloScriptPlusRuntime(
      {
        root: { type: 'composition', children: [] },
      } as any,
      {
        manifestUrl: 'http://test/manifest.json',
      }
    );

    // Wait for init
    await new Promise((r) => setTimeout(r, 10));

    // Initial check - player at 0,1.6,0 (inside 0,0,0 - 10,10,10)
    // The player default is [0, 1.6, 0] which is indeed inside.

    // Trigger update
    runtime.mount({}); // Required to start update loop technically, but we can call update manually
    runtime.update(0.016);

    // Should trigger load
    expect(global.fetch).toHaveBeenCalledWith('http://test/manifest.json');
    // It might take a tick for the promise to resolve and the loader to process
    await new Promise((r) => setTimeout(r, 10));

    expect(global.fetch).toHaveBeenCalledWith('zone-a.chunk.json');
  });
});
