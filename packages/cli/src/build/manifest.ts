import { Chunk, Manifest, ChunkInfo } from './splitter';
import * as path from 'path';

export class ManifestGenerator {
  /**
   * Generate manifest from chunks
   */
  public generate(chunks: Chunk[], outputDir: string): Manifest {
    const manifest: Manifest = {
      entry: 'main.chunk.js',
      chunks: {}
    };

    for (const chunk of chunks) {
      const fileName = `${chunk.id}.chunk.js`;
      const info: ChunkInfo = {
        file: fileName,
        dependencies: [] // TODO: Analyze cross-chunk references
      };

      // Add spatial bounds if available in chunk metadata/zones
      if (chunk.metadata.bounds) {
        info.bounds = chunk.metadata.bounds;
      }

      manifest.chunks[chunk.id] = info;
    }

    return manifest;
  }
}
