import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SceneTester } from '../SceneTester';
import * as path from 'path';
import * as fs from 'fs';

describe('Scene Visual Regression', () => {
  let tester: SceneTester;
  const rootDir = path.resolve(process.cwd(), '../..');
  const baselineDir = path.join(process.cwd(), 'baselines');
  const diffDir = path.join(process.cwd(), 'diffs');

  beforeAll(async () => {
    tester = new SceneTester({
      width: 1280,
      height: 720,
      baselineDir,
      diffDir
    });
    await tester.setup();
  });

  afterAll(async () => {
    await tester.teardown();
  });

  it('renders "Floating Cyan Orb" correctly', async () => {
    const holoPath = path.join(rootDir, 'examples/quickstart/1-floating-cyan-orb.holo');
    const success = await tester.testScene(holoPath, 'cyan-orb');
    expect(success).toBe(true);
  });

  it('renders "Red Cube Teal Button" correctly', async () => {
    const holoPath = path.join(rootDir, 'examples/quickstart/2-red-cube-teal-button.holo');
    const success = await tester.testScene(holoPath, 'cube-button');
    expect(success).toBe(true);
  });

  it('renders complex world with zones', async () => {
    // This uses the test file we created earlier
    const holoPath = path.join(rootDir, 'world-with-zones.holo');
    const success = await tester.testScene(holoPath, 'world-with-zones');
    expect(success).toBe(true);
  });
});
