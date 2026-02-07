import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

export interface DiffResult {
  diffPixels: number;
  diffImage?: Buffer;
  width: number;
  height: number;
}

export function compareImages(
  actualBuffer: Buffer,
  baselineBuffer: Buffer,
  threshold: number = 0.1
): DiffResult {
  const img1 = PNG.sync.read(actualBuffer);
  const img2 = PNG.sync.read(baselineBuffer);
  const { width, height } = img1;

  if (img2.width !== width || img2.height !== height) {
    throw new Error(
      `Image dimensions do not match: ${width}x${height} vs ${img2.width}x${img2.height}`
    );
  }

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold });

  return {
    diffPixels,
    diffImage: PNG.sync.write(diff),
    width,
    height,
  };
}

export function saveDiff(result: DiffResult, diffPath: string): void {
  if (result.diffImage) {
    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, result.diffImage);
  }
}
